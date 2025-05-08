const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

/**
 * File operations helper
 */
const fileHelper = {
  /**
   * Creates directories if they don't exist
   * @param {string} dirPath - Directory path to create
   */
  ensureDirectoryExists: (dirPath) => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(chalk.green(`Created directory: ${dirPath}`));
    }
  },

  /**
   * Reads data from a JSON file, creates the file with default data if it doesn't exist
   * @param {string} filePath - Path to the JSON file
   * @param {object} defaultData - Default data to use if file doesn't exist
   * @returns {object} - Parsed JSON data
   */
  readJsonFile: (filePath, defaultData = {}) => {
    try {
      fileHelper.ensureDirectoryExists(path.dirname(filePath));
      
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
        return defaultData;
      }
      
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(chalk.red(`Error reading file ${filePath}:`), error.message);
      return defaultData;
    }
  },

  /**
   * Writes data to a JSON file
   * @param {string} filePath - Path to the JSON file
   * @param {object} data - Data to write
   * @returns {boolean} - Success status
   */
  writeJsonFile: (filePath, data) => {
    try {
      fileHelper.ensureDirectoryExists(path.dirname(filePath));
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(chalk.red(`Error writing to file ${filePath}:`), error.message);
      return false;
    }
  },

  /**
   * Appends an item to an array in a JSON file
   * @param {string} filePath - Path to the JSON file
   * @param {object} item - Item to append
   * @param {string} arrayProperty - Property name of the array in the JSON file (optional)
   * @returns {boolean} - Success status
   */
  appendToJsonArray: (filePath, item, arrayProperty = null) => {
    try {
      fileHelper.ensureDirectoryExists(path.dirname(filePath));
      
      let data = {};
      if (fs.existsSync(filePath)) {
        data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
      
      if (arrayProperty) {
        if (!data[arrayProperty]) {
          data[arrayProperty] = [];
        }
        data[arrayProperty].push(item);
      } else {
        if (!Array.isArray(data)) {
          data = [];
        }
        data.push(item);
      }
      
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(chalk.red(`Error appending to file ${filePath}:`), error.message);
      return false;
    }
  }
};

module.exports = fileHelper;