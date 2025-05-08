const chalk = require('chalk');
const aiService = require('./aiService');
const twitterService = require('./twitterService');
const trendsService = require('./trendsService');
const imageService = require('./imageService');
const metricsService = require('./metricsService');
const topicRotator = require('../utils/topicRotator');
const threadSplitter = require('../utils/threadSplitter');
const fileHelper = require('../utils/fileHelper');
const config = require('../utils/config');

/**
 * Main bot service that coordinates the tweet generation and posting process
 */
const botService = {
  /**
   * Generates and posts a tweet based on AI content
   * @param {string} [forcedTopic] - Optional topic to use (instead of rotating)
   * @param {boolean} [includeImage] - Whether to include an image with the tweet
   * @returns {Promise<object>} - Information about the posted tweet
   */
  generateAndPostTweet: async (forcedTopic = null, includeImage = false) => {
    try {
      // Create data directories if they don't exist
      Object.values(config.dataFiles).forEach(file => {
        fileHelper.ensureDirectoryExists(require('path').dirname(file));
      });
      
      // Get a topic to tweet about
      const topic = forcedTopic || topicRotator.getNextTopic();
      console.log(chalk.cyan(`🎯 Selected topic: ${topic}`));
      
      // Get trending topics for context
      console.log(chalk.cyan('🔍 Fetching trending topics...'));
      const trendingTopics = await trendsService.getTrendingTopics();
      const relevantKeywords = trendsService.extractKeywords(trendingTopics);
      console.log(chalk.cyan(`📊 Trending keywords: ${relevantKeywords.join(', ')}`));
      
      // Generate tweet content
      console.log(chalk.cyan(`✍️ Generating tweet content about "${topic}"...`));
      const tweetContent = await aiService.generateTweetContent(topic, relevantKeywords);
      
      // Split into threads if needed
      const threads = threadSplitter.splitIntoThreads(tweetContent);
      console.log(chalk.cyan(`📝 Created ${threads.length} tweet${threads.length > 1 ? 's' : ''} for the thread`));
      
      // Get and process an image if requested
      let imageBuffer = null;
      if (includeImage) {
        try {
          console.log(chalk.cyan('🖼️ Fetching a relevant image...'));
          const imageUrl = await imageService.getTechImage(topic);
          if (imageUrl) {
            console.log(chalk.cyan(`🖼️ Processing image from: ${imageUrl}`));
            imageBuffer = await imageService.getImageForTweet(imageUrl);
          }
        } catch (imageError) {
          console.error(chalk.yellow('Warning: Failed to process image:'), imageError.message);
        }
      }
      
      // Post the tweet/thread
      console.log(chalk.cyan('🐦 Posting to Twitter...'));
      const tweetData = await twitterService.postThread(threads, imageBuffer);
      console.log(chalk.green('✅ Successfully posted to Twitter!'));
      
      // Log the metrics
      await metricsService.logTweetMetrics(tweetData, topic);
      
      return {
        threads,
        topic,
        imageUrl: imageBuffer ? 'Image attached' : null,
        tweetIds: tweetData.ids
      };
    } catch (error) {
      console.error(chalk.red('❌ Error in bot service:'), error.message);
      throw new Error(`Failed to generate and post tweet: ${error.message}`);
    }
  }
};

module.exports = botService;