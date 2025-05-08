const { TwitterApi } = require('twitter-api-v2');
const chalk = require('chalk');
const fileHelper = require('../utils/fileHelper');
const config = require('../utils/config');
const { RateLimiter } = require('limiter');
const retry = require('async-retry');

// Initialize rate limiters
const tweetLimiter = new RateLimiter({
  tokensPerInterval: 300, // Twitter's rate limit for tweets
  interval: "hour"
});

const mediaLimiter = new RateLimiter({
  tokensPerInterval: 30, // Twitter's rate limit for media uploads
  interval: "hour"
});

// Initialize the Twitter API client
const twitterClient = process.env.TWITTER_BEARER_TOKEN
  ? new TwitterApi(process.env.TWITTER_BEARER_TOKEN)
  : null;

// Create read/write client (for posting tweets)  
const rwClientFirst = process.env.TWITTER_API_KEY &&
  process.env.TWITTER_API_SECRET &&
  process.env.TWITTER_ACCESS_TOKEN &&
  process.env.TWITTER_ACCESS_SECRET
  ? new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    })
  : null;

const rwClient = rwClientFirst.readWrite;

/**
 * Service for interacting with the Twitter API
 */
const twitterService = {
  /**
   * Posts a tweet with rate limiting and retries
   * @param {string} content - Tweet content
   * @param {Buffer} [imageBuffer] - Optional image buffer to attach
   * @returns {Promise<object>} - Tweet data
   */
  postTweet: async (content, imageBuffer = null) => {
    return retry(async (bail) => {
      try {
        if (!rwClient) {
          throw new Error('Twitter API credentials not properly configured');
        }
        
        // Wait for rate limit token
        await tweetLimiter.removeTokens(1);
        
        // Prepare tweet parameters
        const tweetParams = { text: content };
        
        // If an image buffer is provided, upload it
        if (imageBuffer) {
          try {
            await mediaLimiter.removeTokens(1);
            const mediaId = await rwClient.v1.uploadMedia(imageBuffer, { type: 'image/jpeg' });
            tweetParams.media = { media_ids: [mediaId] };
          } catch (mediaError) {
            console.error(chalk.yellow('Warning: Failed to upload image:'), mediaError.message);
            // Continue without the image if upload fails
          }
        }
        
        // Post the tweet
        const response = await rwClient.v2.tweet(tweetParams);
        
        return {
          id: response.data.id,
          content
        };
      } catch (error) {
        if (error.code === 429) { // Rate limit error
          throw error; // Retry
        }
        bail(error); // Don't retry other errors
        throw error;
      }
    }, {
      retries: 3,
      minTimeout: 5000,
      maxTimeout: 15000,
      onRetry: (error) => {
        console.log(chalk.yellow(`Retrying tweet post due to error: ${error.message}`));
      }
    });
  },
  
  /**
   * Posts a thread of tweets with rate limiting
   * @param {string[]} threads - Array of tweet contents
   * @param {Buffer} [imageBuffer] - Optional image buffer to attach to first tweet
   * @returns {Promise<object>} - Data about the thread
   */
  postThread: async (threads, imageBuffer = null) => {
    try {
      if (!rwClient) {
        throw new Error('Twitter API credentials not properly configured');
      }
      
      if (!threads || threads.length === 0) {
        throw new Error('No thread content provided');
      }
      
      // Post the first tweet, possibly with an image
      const firstTweet = await twitterService.postTweet(threads[0], imageBuffer);
      let previousTweetId = firstTweet.id;
      
      // Post the rest of the thread as replies
      const threadIds = [firstTweet.id];
      
      for (let i = 1; i < threads.length; i++) {
        try {
          await tweetLimiter.removeTokens(1);
          
          const replyParams = {
            text: threads[i],
            reply: { in_reply_to_tweet_id: previousTweetId }
          };
          
          const replyResponse = await rwClient.v2.tweet(replyParams);
          threadIds.push(replyResponse.data.id);
          previousTweetId = replyResponse.data.id;
          
          // Add a small delay between tweets to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (replyError) {
          console.error(chalk.yellow(`Warning: Failed to post thread part ${i+1}:`), replyError.message);
          // Continue with the rest of the thread
        }
      }
      
      return {
        ids: threadIds,
        content: threads
      };
    } catch (error) {
      console.error(chalk.red('Error posting thread:'), error.message);
      throw new Error(`Failed to post thread: ${error.message}`);
    }
  },
  
  /**
   * Gets metrics for a specific tweet with retries
   * @param {string} tweetId - ID of the tweet
   * @returns {Promise<object>} - Tweet metrics
   */
  getTweetMetrics: async (tweetId) => {
    return retry(async (bail) => {
      try {
        if (!twitterClient) {
          throw new Error('Twitter API credentials not properly configured');
        }
        
        // Get tweet metrics including public metrics
        const response = await twitterClient.v2.singleTweet(tweetId, {
          'tweet.fields': ['public_metrics', 'created_at', 'non_public_metrics']
        });
        
        if (!response.data) {
          throw new Error('Tweet not found');
        }
        
        const { public_metrics, created_at, non_public_metrics } = response.data;
        
        return {
          id: tweetId,
          createdAt: created_at,
          likes: public_metrics.like_count || 0,
          retweets: public_metrics.retweet_count || 0,
          replies: public_metrics.reply_count || 0,
          quotes: public_metrics.quote_count || 0,
          impressions: non_public_metrics?.impression_count || public_metrics.impression_count || 0,
          engagementRate: non_public_metrics ? 
            ((public_metrics.like_count + public_metrics.retweet_count) / non_public_metrics.impression_count * 100).toFixed(2) + '%' : 
            'N/A'
        };
      } catch (error) {
        if (error.code === 429) { // Rate limit error
          throw error; // Retry
        }
        console.error(chalk.yellow(`Warning: Failed to get metrics for tweet ${tweetId}:`), error.message);
        return {
          id: tweetId,
          createdAt: new Date().toISOString(),
          likes: 0,
          retweets: 0,
          replies: 0,
          quotes: 0,
          impressions: 0,
          error: error.message
        };
      }
    }, {
      retries: 3,
      minTimeout: 5000,
      maxTimeout: 15000
    });
  },
  
  /**
   * Updates metrics for all tweets in the database with rate limiting
   * @returns {Promise<number>} - Number of tweets updated
   */
  updateAllTweetMetrics: async () => {
    try {
      // Read all tweets from the database
      const tweetsFile = config.dataFiles.tweets;
      const metricsFile = config.dataFiles.metrics;
      
      const tweets = fileHelper.readJsonFile(tweetsFile, { tweets: [] });
      const metrics = fileHelper.readJsonFile(metricsFile, { metrics: [] });
      
      // Only update metrics for tweets in the last 7 days (Twitter rate limits)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);
      
      const recentTweets = tweets.tweets.filter(tweet => 
        new Date(tweet.date) > cutoffDate
      );
      
      // Update metrics for each recent tweet
      let updatedCount = 0;
      for (const tweet of recentTweets) {
        if (!tweet.id) continue;
        
        try {
          const newMetrics = await twitterService.getTweetMetrics(tweet.id);
          
          // Find and update the metrics for this tweet
          const existingMetricIndex = metrics.metrics.findIndex(m => m.tweetId === tweet.id);
          
          if (existingMetricIndex >= 0) {
            metrics.metrics[existingMetricIndex] = {
              ...metrics.metrics[existingMetricIndex],
              likes: newMetrics.likes,
              retweets: newMetrics.retweets,
              replies: newMetrics.replies,
              quotes: newMetrics.quotes,
              impressions: newMetrics.impressions,
              engagementRate: newMetrics.engagementRate,
              updatedAt: new Date().toISOString()
            };
          } else {
            metrics.metrics.push({
              tweetId: tweet.id,
              content: tweet.content[0], // First tweet in the thread
              topic: tweet.topic,
              date: tweet.date,
              likes: newMetrics.likes,
              retweets: newMetrics.retweets,
              replies: newMetrics.replies,
              quotes: newMetrics.quotes,
              impressions: newMetrics.impressions,
              engagementRate: newMetrics.engagementRate,
              updatedAt: new Date().toISOString()
            });
          }
          
          updatedCount++;
          
          // Add a small delay between API calls
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(chalk.yellow(`Warning: Failed to update metrics for tweet ${tweet.id}:`), error.message);
        }
      }
      
      // Save the updated metrics
      fileHelper.writeJsonFile(metricsFile, metrics);
      
      return updatedCount;
    } catch (error) {
      console.error(chalk.red('Error updating tweet metrics:'), error.message);
      return 0;
    }
  }
};

module.exports = twitterService;