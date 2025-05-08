#!/usr/bin/env node
require('dotenv').config();
const { program } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const { generateAndPostTweet } = require('./services/botService');
const { getLatestMetrics } = require('./services/metricsService');

program
  .version('1.0.0')
  .description('AI Tech Tweet Bot CLI');

program
  .command('tweet')
  .description('Generate and post a tweet immediately')
  .option('-t, --topic <topic>', 'Specify a topic (optional)')
  .option('-i, --image', 'Include an image', false)
  .action(async (options) => {
    const spinner = ora('Generating and posting tweet...').start();
    try {
      const result = await generateAndPostTweet(options.topic, options.image);
      spinner.succeed('Tweet posted successfully!');
      console.log(chalk.green('Tweet content:'));
      result.threads.forEach((thread, index) => {
        console.log(chalk.cyan(`[Thread ${index + 1}/${result.threads.length}]:`), chalk.white(thread));
      });
      console.log(chalk.yellow('Topic used:'), chalk.white(result.topic));
      if (result.imageUrl) {
        console.log(chalk.yellow('Image:'), chalk.white(result.imageUrl));
      }
    } catch (error) {
      spinner.fail('Failed to post tweet');
      console.error(chalk.red('Error:'), error.message);
    }
  });

program
  .command('metrics')
  .description('View tweet engagement metrics')
  .option('-l, --limit <number>', 'Number of tweets to show', 5)
  .action(async (options) => {
    const spinner = ora('Fetching tweet metrics...').start();
    try {
      const metrics = await getLatestMetrics(parseInt(options.limit));
      spinner.succeed('Metrics retrieved successfully!');
      
      if (metrics.length === 0) {
        console.log(chalk.yellow('No metrics found. The bot may not have posted any tweets yet.'));
        return;
      }
      
      console.log(chalk.green.bold('\nLatest Tweet Metrics:'));
      metrics.forEach((metric, index) => {
        console.log(chalk.cyan.bold(`\n[Tweet ${index + 1}/${metrics.length}] - ${new Date(metric.date).toLocaleString()}`));
        console.log(chalk.yellow('Content:'), chalk.white(metric.content.substring(0, 50) + '...'));
        console.log(chalk.yellow('Topic:'), chalk.white(metric.topic));
        console.log(chalk.yellow('Engagement:'), chalk.white(`❤️ ${metric.likes} likes, 🔁 ${metric.retweets} retweets, 💬 ${metric.replies} replies`));
        console.log(chalk.yellow('Link:'), chalk.blue(`https://twitter.com/user/status/${metric.tweetId}`));
      });
      
      // Show summary
      const totalLikes = metrics.reduce((sum, m) => sum + m.likes, 0);
      const totalRetweets = metrics.reduce((sum, m) => sum + m.retweets, 0);
      console.log(chalk.green.bold('\nSummary:'));
      console.log(chalk.yellow(`Total engagement for last ${metrics.length} tweets:`), 
        chalk.white(`❤️ ${totalLikes} likes, 🔁 ${totalRetweets} retweets`));
    } catch (error) {
      spinner.fail('Failed to retrieve metrics');
      console.error(chalk.red('Error:'), error.message);
    }
  });

program.parse(process.argv);

// If no arguments are provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}