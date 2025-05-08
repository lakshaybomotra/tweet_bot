const config = require('./config');

/**
 * Utilities for splitting long tweets into threads
 */
const threadSplitter = {
  /**
   * Splits a long tweet into multiple tweets that make semantic sense
   * @param {string} tweetContent - The original tweet content
   * @returns {string[]} - Array of tweet parts
   */
  splitIntoThreads: (tweetContent) => {
    const maxLength = config.maxTweetLength;
    const maxThreads = config.maxThreadCount;
    
    // If the tweet is already short enough, return it as a single tweet
    if (tweetContent.length <= maxLength) {
      return [tweetContent];
    }
    
    const threads = [];
    let remainingContent = tweetContent;
    
    // Iterate until we've processed all content or reached the max thread count
    while (remainingContent.length > 0 && threads.length < maxThreads) {
      // If what's left is short enough, add it as the last thread and break
      if (remainingContent.length <= maxLength) {
        threads.push(remainingContent);
        break;
      }
      
      // Find a good split point (end of sentence or at least end of word)
      let splitIndex = findSplitPoint(remainingContent, maxLength);
      
      // Add thread numbering if this will be a multi-part thread
      const threadPart = remainingContent.substring(0, splitIndex).trim();
      threads.push(threadPart);
      
      // Remove the part we just added from the remaining content
      remainingContent = remainingContent.substring(splitIndex).trim();
    }
    
    // If we still have content but hit the max thread count, add an ellipsis to the last thread
    if (remainingContent.length > 0 && threads.length === maxThreads) {
      threads[threads.length - 1] = threads[threads.length - 1].substring(0, maxLength - 3) + '...';
    }
    
    // Add thread numbering (1/3, 2/3, etc.)
    return threads.map((thread, index) => 
      `${thread} ${index + 1}/${threads.length}`
    );
  }
};

/**
 * Helper function to find a good split point for a tweet
 * Prioritizes splitting at the end of sentences, then at punctuation, then at spaces
 * @param {string} text - Text to split
 * @param {number} maxLength - Maximum length allowed
 * @returns {number} - Index where to split the text
 */
function findSplitPoint(text, maxLength) {
  if (text.length <= maxLength) return text.length;
  
  // Try to find the end of a sentence within the limit (., !, ?)
  for (let i = maxLength; i >= maxLength - 30 && i > 0; i--) {
    if (i < text.length && ['.', '!', '?'].includes(text[i]) && (i + 1 >= text.length || text[i + 1] === ' ')) {
      return i + 1;
    }
  }
  
  // If no sentence end found, try to find end of clause (,, ;, :)
  for (let i = maxLength; i >= maxLength - 30 && i > 0; i--) {
    if (i < text.length && [',', ';', ':'].includes(text[i]) && (i + 1 >= text.length || text[i + 1] === ' ')) {
      return i + 1;
    }
  }
  
  // If no good punctuation, find the last space before the limit
  for (let i = maxLength; i >= maxLength - 30 && i > 0; i--) {
    if (text[i] === ' ') {
      return i + 1;
    }
  }
  
  // If no good split found, split at the limit (not ideal)
  return maxLength;
}

module.exports = threadSplitter;