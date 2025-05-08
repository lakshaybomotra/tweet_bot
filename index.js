// AI Tech Tweet Bot - Main entry point
require('dotenv').config();
const express = require('express');
const chalk = require('chalk');
const { generateAndPostTweet } = require('./services/botService');
const { tweetInterval, tweetsPerDay } = require('./utils/config');
const { router: statusRouter, updateBotStatus } = require('./routes/status');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Mount status routes
app.use('/api', statusRouter);  // This will make status available at /api/status and health at /api/health

// Track daily tweet count
let dailyTweetCount = 0;
let lastResetDate = new Date().toDateString();

// Function to reset daily tweet count if it's a new day
const resetDailyCount = () => {
  const currentDate = new Date().toDateString();
  if (currentDate !== lastResetDate) {
    dailyTweetCount = 0;
    lastResetDate = currentDate;
    console.log(chalk.cyan('🔄 Reset daily tweet count'));
  }
};

// Function to post a tweet
const postTweet = async () => {
  try {
    resetDailyCount();
    
    if (dailyTweetCount >= tweetsPerDay) {
      console.log(chalk.yellow('📊 Daily tweet limit reached. Waiting for next day...'));
      return;
    }
    
    console.log(chalk.green(`🚀 Posting tweet #${dailyTweetCount + 1} of ${tweetsPerDay}`));
    updateBotStatus({ isRunning: true });
    
    await generateAndPostTweet();
    dailyTweetCount++;
    
    console.log(chalk.green(`✅ Tweet #${dailyTweetCount} successfully posted`));
    updateBotStatus({
      lastRun: new Date().toISOString(),
      isRunning: false,
      lastError: null,
      tweetsToday: dailyTweetCount,
      tweetsRemaining: tweetsPerDay - dailyTweetCount
    });
  } catch (error) {
    console.error(chalk.red('❌ Error posting tweet:'), error.message);
    updateBotStatus({
      lastError: error.message,
      isRunning: false
    });
  }
};

// Start the tweet posting interval
console.log(chalk.yellow(`⏰ Will post ${tweetsPerDay} tweets per day with ${tweetInterval / (60 * 60 * 1000)} hour intervals`));

// Post first tweet immediately
postTweet();

// Set up interval for subsequent tweets
const tweetTimer = setInterval(postTweet, tweetInterval);

// Update next scheduled run time
const updateNextRunTime = () => {
  try {
    const now = new Date();
    const nextRun = new Date(now.getTime() + tweetInterval);
    
    updateBotStatus({ 
      nextScheduledRun: nextRun.toISOString(),
      tweetsToday: dailyTweetCount,
      tweetsRemaining: tweetsPerDay - dailyTweetCount
    });
  } catch (error) {
    console.error(chalk.red('❌ Error updating next run time:'), error.message);
    updateBotStatus({ 
      nextScheduledRun: null,
      lastError: `Failed to calculate next run time: ${error.message}`
    });
  }
};

// Initial update of next run time
updateNextRunTime();

// Update next run time after each interval
setInterval(updateNextRunTime, tweetInterval);

// Start the server
app.listen(PORT, () => {
  console.log(chalk.green(`\n🤖 AI Tech Tweet Bot is running!`));
  console.log(chalk.white('  - Server listening on port'), chalk.cyan(PORT));
  console.log(chalk.white('  - Status endpoint:'), chalk.cyan(`http://localhost:${PORT}/api/status`));
  console.log(chalk.white('  - Health endpoint:'), chalk.cyan(`http://localhost:${PORT}/api/health`));
  console.log(chalk.white('  - Run "npm run tweet" to generate and post a tweet immediately'));
  console.log(chalk.cyan.dim('Bot is running in the background. Keep this process running to enable scheduled tweets.'));
});