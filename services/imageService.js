const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const config = require('../utils/config');
const chalk = require('chalk');

/**
 * Service for fetching and processing images
 */
const imageService = {
  /**
   * Fetches a relevant tech-themed image from Unsplash
   * @param {string} topic - The topic to search for
   * @returns {Promise<string|null>} - Image URL or null if failed
   */
  getTechImage: async (topic) => {
    try {
      if (!process.env.UNSPLASH_ACCESS_KEY) {
        console.log(chalk.yellow('Warning: UNSPLASH_ACCESS_KEY not set. Skipping image.'));
        return null;
      }

      // Prepare search query based on the topic
      const searchQuery = `${topic.toLowerCase()},${config.unsplashSearchQuery}`;
      
      // Call Unsplash API to search for relevant photos
      const response = await axios.get(`${config.unsplashApiUrl}/photos/random`, {
        params: {
          query: searchQuery,
          orientation: 'landscape',
          content_filter: 'high',
        },
        headers: {
          Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
        }
      });
      
      return response.data.urls.regular;
    } catch (error) {
      console.error(chalk.yellow('Warning: Failed to fetch image:'), error.message);
      return null;
    }
  },
  
  /**
   * Downloads and processes an image for Twitter
   * @param {string} imageUrl - URL of the image to download
   * @returns {Promise<Buffer>} - Processed image buffer
   */
  getImageForTweet: async (imageUrl) => {
    try {
      // Download the image
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);
      
      // Process the image with sharp
      const processedImage = await sharp(buffer)
        .resize(1200, 675, { // Twitter's recommended aspect ratio
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 90 })
        .toBuffer();
      
      return processedImage;
    } catch (error) {
      console.error(chalk.red('Error processing image:'), error.message);
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }
};

module.exports = imageService;