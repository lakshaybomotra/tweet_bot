// AI Tech Tweet Bot - Main entry point
require('dotenv').config();
const cron = require('node-cron');
const chalk = require('chalk');
const { generateAndPostTweet } = require('./services/botService');
const { schedulerTime } = require('./utils/config');

console.log(chalk.cyan.bold('🤖 AI Tech Tweet Bot is starting up...'));
console.log(chalk.yellow(`⏰ Scheduled to run at: ${process.env.TWEET_TIME || schedulerTime}`));

// Schedule the cron job to run at the configured time
cron.schedule(process.env.TWEET_TIME || schedulerTime, async () => {
  console.log(chalk.green(`🚀 Running scheduled tweet job at ${new Date().toLocaleString()}`));
  try {
    await generateAndPostTweet();
    console.log(chalk.green('✅ Scheduled tweet successfully completed'));
  } catch (error) {
    console.error(chalk.red('❌ Error in scheduled tweet:'), error.message);
  }
});

console.log(chalk.cyan('📋 Use the CLI to manage the bot manually:'));
console.log(chalk.white('  - Run "npm run tweet" to generate and post a tweet immediately'));
console.log(chalk.white('  - Run "npm run metrics" to view engagement metrics'));
console.log(chalk.cyan.dim('Bot is running in the background. Keep this process running to enable scheduled tweets.'));