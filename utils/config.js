/**
 * Configuration settings for the Twitter bot
 */
const config = {
  // Scheduler configuration
  tweetInterval: 3 * 60 * 60 * 1000, // 3 hours in milliseconds
  tweetsPerDay: 10, // Number of tweets to post per day
  
  // Tweet generation configuration
  maxTweetLength: 280,
  maxThreadCount: 4,
  
  // Topics rotation
  topics: [
    'AI tools',
    'LangChain tricks',
    'ML tips',
    'Open-source LLMs',
    'AI ethics',
    'GPT prompting',
    'AI for developers',
    'Generative AI',
    'Vector databases',
    'AI coding assistants',
    'AI workflows',
    'Large Language Models'
  ],
  
  // Number of topics to avoid repeating
  topicHistoryLength: 4,
  
  // File paths
  dataFiles: {
    tweets: './data/tweets.json',
    metrics: './data/metrics.json',
    topics: './data/topics.json'
  },
  
  // API configurations
  hackerNewsApiUrl: 'https://hacker-news.firebaseio.com/v0',
  unsplashApiUrl: 'https://api.unsplash.com',
  unsplashSearchQuery: 'technology,artificial intelligence,computer,machine learning',
  
  // Tweet generation
  promptTemplate: (topic, trendingTopics) => `
    Generate an engaging and visually appealing tweet about ${topic} in AI technology.
    
    Consider these trending topics if relevant: ${trendingTopics.join(', ')}
    
    Follow these formatting guidelines:
    1. Start with a relevant emoji that matches the topic
    2. Use bullet points (•) to structure information clearly
    3. Add emphasis with ✨ or 🔥 for key points
    4. Include 2-3 relevant hashtags at the end
    5. Use emojis sparingly but effectively (2-3 max in the main content)
    
    The tweet should:
    • Share a practical insight or tip about ${topic}
    • Be clear and easy to understand
    • Use professional but conversational language
    • Be approximately 200-250 characters
    • End with relevant hashtags
    
    Example format:
    "🤖 Did you know? LLMs can now:
    • Feature 1 ✨
    • Feature 2 🔥
    
    Key insight here!
    
    #Hashtag1 #Hashtag2"
    
    DO NOT:
    • Use "Check out" or promotional language
    • Include URLs or links
    • Overuse emojis or make it look unprofessional
    • Make it sound like an advertisement
    
    DO focus on providing valuable, educational content that looks visually appealing and is easy to read.
  `,
};

module.exports = config;