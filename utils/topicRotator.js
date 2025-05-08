const config = require('./config');
const fileHelper = require('./fileHelper');

/**
 * Manages the rotation of tweet topics
 */
const topicRotator = {
  /**
   * Selects a topic that hasn't been used recently
   * @returns {string} - The selected topic
   */
  getNextTopic: () => {
    const topicsFile = config.dataFiles.topics;
    const allTopics = config.topics;
    
    // Read the topic history
    const topicData = fileHelper.readJsonFile(topicsFile, { 
      recentTopics: [],
      lastUsed: {}
    });
    
    // Filter out recently used topics
    const recentTopics = topicData.recentTopics || [];
    const availableTopics = allTopics.filter(topic => !recentTopics.includes(topic));
    
    // If we've used all topics recently, reset and use the least recently used
    let selectedTopic;
    if (availableTopics.length === 0) {
      // Sort topics by when they were last used (oldest first)
      const sortedByLastUsed = allTopics.slice().sort((a, b) => {
        const lastUsedA = topicData.lastUsed[a] || 0;
        const lastUsedB = topicData.lastUsed[b] || 0;
        return lastUsedA - lastUsedB;
      });
      
      // Take the oldest used topic
      selectedTopic = sortedByLastUsed[0];
      
      // Reset the recent topics list, keeping only the most recent one
      topicData.recentTopics = recentTopics.length > 0 ? [recentTopics[recentTopics.length - 1]] : [];
    } else {
      // Randomly pick from available topics
      selectedTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
    }
    
    // Update the topic history
    topicData.recentTopics.push(selectedTopic);
    
    // Keep only the most recent N topics
    if (topicData.recentTopics.length > config.topicHistoryLength) {
      topicData.recentTopics.shift();
    }
    
    // Update the last used timestamp for this topic
    topicData.lastUsed[selectedTopic] = Date.now();
    
    // Save the updated topic history
    fileHelper.writeJsonFile(topicsFile, topicData);
    
    return selectedTopic;
  }
};

module.exports = topicRotator;