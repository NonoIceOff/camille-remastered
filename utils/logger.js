/**
 * Professional logging system for the bot
 * @module utils/logger
 */

const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logsDir = path.join(__dirname, '..', 'logs');
    this.ensureLogsDirectory();
  }

  /**
   * Ensure logs directory exists
   */
  ensureLogsDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  /**
   * Get current timestamp
   */
  getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Format log message
   */
  formatMessage(level, category, message, data = null) {
    const timestamp = this.getTimestamp();
    const dataStr = data ? `\n${JSON.stringify(data, null, 2)}` : '';
    return `[${timestamp}] [${level}] [${category}] ${message}${dataStr}`;
  }

  /**
   * Write to log file
   */
  writeToFile(level, message) {
    const date = new Date().toISOString().split('T')[0];
    const filename = path.join(this.logsDir, `${date}.log`);
    const logMessage = `${message}\n`;

    fs.appendFile(filename, logMessage, (err) => {
      if (err) console.error('Error writing to log file:', err);
    });
  }

  /**
   * Log info message
   */
  info(category, message, data = null) {
    const formatted = this.formatMessage('INFO', category, message, data);
    console.log(`\x1b[36m${formatted}\x1b[0m`); // Cyan
    this.writeToFile('INFO', formatted);
  }

  /**
   * Log success message
   */
  success(category, message, data = null) {
    const formatted = this.formatMessage('SUCCESS', category, message, data);
    console.log(`\x1b[32m${formatted}\x1b[0m`); // Green
    this.writeToFile('SUCCESS', formatted);
  }

  /**
   * Log warning message
   */
  warn(category, message, data = null) {
    const formatted = this.formatMessage('WARN', category, message, data);
    console.warn(`\x1b[33m${formatted}\x1b[0m`); // Yellow
    this.writeToFile('WARN', formatted);
  }

  /**
   * Log error message
   */
  error(category, message, data = null) {
    const formatted = this.formatMessage('ERROR', category, message, data);
    console.error(`\x1b[31m${formatted}\x1b[0m`); // Red
    this.writeToFile('ERROR', formatted);
  }

  /**
   * Log debug message (only in development)
   */
  debug(category, message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      const formatted = this.formatMessage('DEBUG', category, message, data);
      console.log(`\x1b[35m${formatted}\x1b[0m`); // Magenta
      this.writeToFile('DEBUG', formatted);
    }
  }

  /**
   * Log command execution
   */
  command(userId, commandName, options = null) {
    this.info('COMMAND', `User ${userId} executed /${commandName}`, options);
  }

  /**
   * Log API request
   */
  apiRequest(method, url, status) {
    this.info('API', `${method} ${url} - Status: ${status}`);
  }

  /**
   * Log API error
   */
  apiError(method, url, error) {
    this.error('API', `${method} ${url} - Error: ${error.message}`, error);
  }
}

module.exports = new Logger();
