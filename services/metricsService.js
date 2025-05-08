const fileHelper = require('../utils/fileHelper');
const config = require('../utils/config');
const twitterService = require('./twitterService');
const chalk = require('chalk');

/**
 * Service for managing tweet metrics
 */
const metricsService = {
  /**
   * Gets the latest metrics for posted tweets
   * @param {number} limit - Number of tweets to retrieve metrics for
   * @returns {Promise<Array>} - Array of tweet metrics
   */
  getLatestMetrics: async (limit = 5) => {
    try {
      // Try to update metrics from Twitter first
      await twitterService.updateAllTweetMetrics().catch(error => {
        console.error(chalk.yellow('Warning: Failed to update metrics from Twitter:'), error.message);
      });
      
      // Read metrics from the file
      const metricsFile = config.dataFiles.metrics;
      const metricsData = fileHelper.readJsonFile(metricsFile, { metrics: [] });
      
      // Sort by date (newest first) and limit the results
      const sortedMetrics = metricsData.metrics
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit);
      
      return sortedMetrics;
    } catch (error) {
      console.error(chalk.red('Error retrieving tweet metrics:'), error.message);
      return [];
    }
  },
  
  /**
   * Logs a newly posted tweet's metrics
   * @param {object} tweetData - Data about the posted tweet
   * @param {string} topic - The topic of the tweet
   * @returns {Promise<void>}
   */
  logTweetMetrics: async (tweetData, topic) => {
    try {
      const metricsFile = config.dataFiles.metrics;
      const tweetsFile = config.dataFiles.tweets;
      
      // Get the tweet ID (for single tweets) or the first tweet ID (for threads)
      const tweetId = tweetData.id || (tweetData.ids && tweetData.ids[0]);
      
      if (!tweetId) {
        throw new Error('No tweet ID provided');
      }
      
      // Create the tweet content array
      const tweetContent = Array.isArray(tweetData.content) 
        ? tweetData.content 
        : [tweetData.content];
      
      // Log the tweet to the tweets file
      const tweetEntry = {
        id: tweetId,
        content: tweetContent,
        topic,
        date: new Date().toISOString(),
        threadIds: tweetData.ids || [tweetId]
      };
      
      fileHelper.appendToJsonArray(tweetsFile, tweetEntry, 'tweets');
      
      // Initialize metrics for the tweet
      const metricEntry = {
        tweetId,
        content: tweetContent[0], // First tweet in the thread
        topic,
        date: new Date().toISOString(),
        likes: 0,
        retweets: 0,
        replies: 0,
        quotes: 0,
        impressions: 0,
        updatedAt: new Date().toISOString()
      };
      
      fileHelper.appendToJsonArray(metricsFile, metricEntry, 'metrics');
    } catch (error) {
      console.error(chalk.red('Error logging tweet metrics:'), error.message);
    }
  }
};

module.exports = metricsService;