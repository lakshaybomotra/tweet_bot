const express = require('express');
const router = express.Router();

// Store bot status
let botStatus = {
    lastRun: null,
    lastError: null,
    isRunning: false,
    nextScheduledRun: null
};

// Update bot status
const updateBotStatus = (status) => {
    botStatus = { ...botStatus, ...status };
};

// Get current bot status
router.get('/status', (req, res) => {
    res.json({
        status: 'operational',
        lastRun: botStatus.lastRun,
        lastError: botStatus.lastError,
        isRunning: botStatus.isRunning,
        nextScheduledRun: botStatus.nextScheduledRun,
        uptime: process.uptime()
    });
});

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

module.exports = {
    router,
    updateBotStatus
}; 