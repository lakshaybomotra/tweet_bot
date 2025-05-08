# AI Tech Tweet Bot

A Node.js Twitter bot that automatically generates and posts AI/ML content using Google's Gemini API.

## Features

- 🧠 Uses Gemini (Google Generative AI) to generate tweets about AI, ML, LLMs, and LangChain
- 🐦 Posts tweets automatically via Twitter API (OAuth 2.0)
- 🗓️ Runs once per day using node-cron (scheduled at 9 AM by default)
- 🗂️ Stores previous tweets in a JSON file to avoid repetition
- 🔁 Rotates between AI-related subtopics automatically
- 🧵 Splits long tweets into threads (max 280 characters per tweet)
- 🌐 Pulls trending tech topics from Hacker News API
- 🖼️ Optionally fetches relevant tech-themed images from Unsplash API
- 📊 Tracks tweet metrics (likes, retweets)
- 📤 Logs all posted tweets and metrics

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Copy the `.env.example` file to `.env` and fill in your API keys:
   ```
   cp .env.example .env
   ```

## Configuration

You'll need to obtain API keys for:

- Twitter API (v2)
- Google Generative AI (Gemini)
- Unsplash API (optional, for images)

Add these to your `.env` file.

## Usage

### Run the bot on a schedule

```
npm start
```

This will start the bot and schedule it to run daily at 9 AM (configurable in `.env`).

### Manual commands

Generate and post a tweet immediately:
```
npm run tweet
```

With a specific topic:
```
node cli.js tweet --topic "AI tools"
```

Include an image:
```
node cli.js tweet --image
```

View tweet metrics:
```
npm run metrics
```

View more detailed metrics:
```
node cli.js metrics --limit 10
```

## Project Structure

- `/services` - API integration services
- `/utils` - Helper utilities
- `/data` - Stored tweet history and metrics
- `/cron` - Scheduling functionality
- `index.js` - Main entry point
- `cli.js` - Command-line interface

## License

MIT