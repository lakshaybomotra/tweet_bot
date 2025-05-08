const axios = require('axios');
const config = require('../utils/config');
const chalk = require('chalk');

/**
 * Service for fetching trending tech topics from Hacker News
 */
const trendsService = {
  /**
   * Fetches trending topics from Hacker News
   * @param {number} count - Number of topics to fetch
   * @returns {Promise<string[]>} - Array of trending topic titles
   */
  getTrendingTopics: async (count = 5) => {
    try {
      // Fetch top stories from Hacker News
      const response = await axios.get(`${config.hackerNewsApiUrl}/topstories.json`);
      const topStoryIds = response.data.slice(0, count);
      
      // Fetch details for each story
      const storyPromises = topStoryIds.map(id => 
        axios.get(`${config.hackerNewsApiUrl}/item/${id}.json`)
      );
      
      const stories = await Promise.all(storyPromises);
      
      // Extract and return the titles
      return stories.map(story => story.data.title)
        .filter(title => !!title); // Filter out any null titles
    } catch (error) {
      console.error(chalk.yellow('Warning: Failed to fetch trending topics:'), error.message);
      console.log(chalk.yellow('Using default topics instead.'));
      
      // Return some default tech topics if the API call fails
      return [
        'Artificial Intelligence',
        'Machine Learning',
        'ChatGPT',
        'LLM Development',
        'AI Safety'
      ];
    }
  },
  
  /**
   * Extracts relevant keywords from trending topics
   * @param {string[]} trendingTopics - Array of trending topic titles
   * @param {number} count - Maximum number of keywords to extract
   * @returns {string[]} - Array of extracted keywords
   */
  extractKeywords: (trendingTopics, count = 3) => {
    // List of tech-related keywords to look for
    const techKeywords = [
      'ai', 'ml', 'artificial intelligence', 'machine learning', 'deep learning',
      'neural network', 'algorithm', 'data science', 'nlp', 'natural language processing',
      'computer vision', 'robotics', 'automation', 'llm', 'large language model',
      'gpt', 'chatgpt', 'bard', 'claude', 'gemini', 'transformer', 'diffusion',
      'stable diffusion', 'dalle', 'midjourney', 'generative ai', 'vector database',
      'embedding', 'fine-tuning', 'prompt engineering', 'rag', 'retrieval augmented generation'
    ];
    
    // Extract tech keywords from trending topics
    const extractedKeywords = [];
    
    trendingTopics.forEach(topic => {
      const lowerTopic = topic.toLowerCase();
      
      techKeywords.forEach(keyword => {
        if (lowerTopic.includes(keyword) && !extractedKeywords.includes(keyword)) {
          extractedKeywords.push(keyword);
        }
      });
    });
    
    // If we didn't find enough tech keywords, add some trending topic words
    if (extractedKeywords.length < count) {
      // Extract meaningful words (3+ characters) from the topics
      const allWords = trendingTopics.join(' ')
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !['the', 'and', 'that', 'this', 'with'].includes(word));
      
      // Add unique words until we reach the count
      allWords.forEach(word => {
        if (extractedKeywords.length < count && !extractedKeywords.includes(word)) {
          extractedKeywords.push(word);
        }
      });
    }
    
    return extractedKeywords.slice(0, count);
  }
};

module.exports = trendsService;