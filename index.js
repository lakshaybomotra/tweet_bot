// AI Tech Tweet Bot - Main entry point
require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const chalk = require('chalk');
const { generateAndPostTweet } = require('./services/botService');
const { schedulerTime } = require('./utils/config');
const { router: statusRouter, updateBotStatus } = require('./routes/status');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/api', statusRouter);

// Start Express server
app.listen(PORT, () => {
    console.log(chalk.cyan.bold(`🌐 Status server running on port ${PORT}`));
});

console.log(chalk.cyan.bold('🤖 AI Tech Tweet Bot is starting up...'));
console.log(chalk.yellow(`⏰ Scheduled to run at: ${process.env.TWEET_TIME || schedulerTime}`));

// Schedule the cron job to run at the configured time
cron.schedule(process.env.TWEET_TIME || schedulerTime, async () => {
    console.log(chalk.green(`🚀 Running scheduled tweet job at ${new Date().toLocaleString()}`));
    updateBotStatus({ isRunning: true });
    
    try {
        await generateAndPostTweet();
        console.log(chalk.green('✅ Scheduled tweet successfully completed'));
        updateBotStatus({
            lastRun: new Date().toISOString(),
            isRunning: false,
            lastError: null
        });
    } catch (error) {
        console.error(chalk.red('❌ Error in scheduled tweet:'), error.message);
        updateBotStatus({
            lastError: error.message,
            isRunning: false
        });
    }
});

// Update next scheduled run time
const updateNextRunTime = () => {
    const now = new Date();
    const [hours, minutes] = (process.env.TWEET_TIME || schedulerTime).split(':');
    const nextRun = new Date(now);
    nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    if (nextRun < now) {
        nextRun.setDate(nextRun.getDate() + 1);
    }
    
    updateBotStatus({ nextScheduledRun: nextRun.toISOString() });
};

updateNextRunTime();

console.log(chalk.cyan('📋 Use the CLI to manage the bot manually:'));
console.log(chalk.white('  - Run "npm run tweet" to generate and post a tweet immediately'));
console.log(chalk.white('  - Run "npm run metrics" to view engagement metrics'));
console.log(chalk.cyan.dim('Bot is running in the background. Keep this process running to enable scheduled tweets.'));