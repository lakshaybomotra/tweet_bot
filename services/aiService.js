const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../utils/config');
const chalk = require('chalk');

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Service for generating tweet content using Google's Gemini AI
 */
const aiService = {
  /**
   * Generates tweet content based on a topic and trending topics
   * @param {string} topic - The main topic for the tweet
   * @param {string[]} trendingTopics - Array of trending topics to incorporate
   * @returns {Promise<string>} - The generated tweet content
   */
  generateTweetContent: async (topic, trendingTopics = []) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not set in environment variables');
      }

      // Get the model (Gemini Pro is recommended for text generation)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      
      // Create the prompt using the template
      const prompt = config.promptTemplate(topic, trendingTopics);
      
      // Generate content
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      // Clean up the response
      const cleanedText = aiService.cleanGeneratedText(text);
      
      return cleanedText;
    } catch (error) {
      console.error(chalk.red('Error generating tweet content:'), error.message);
      throw new Error(`Failed to generate tweet content: ${error.message}`);
    }
  },
  
  /**
   * Cleans up AI-generated text to make it suitable for tweeting
   * @param {string} text - The raw generated text
   * @returns {string} - Cleaned text
   */
  cleanGeneratedText: (text) => {
    // Remove quotes that might be added by the AI
    let cleaned = text.replace(/^["']|["']$/g, '');
    
    // Remove any "Tweet:" prefix that might be added
    cleaned = cleaned.replace(/^(Tweet:|Here's a tweet:|My tweet:)/i, '').trim();
    
    // Ensure hashtags have no spaces after the # symbol
    cleaned = cleaned.replace(/# ([a-zA-Z0-9]+)/g, '#$1');
    
    // Ensure we don't exceed the max length
    if (cleaned.length > config.maxTweetLength * config.maxThreadCount) {
      cleaned = cleaned.substring(0, config.maxTweetLength * config.maxThreadCount - 3) + '...';
    }
    
    return cleaned;
  }
};

module.exports = aiService;