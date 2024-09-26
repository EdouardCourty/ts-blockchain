import { createLogger, format, transports } from 'winston';
import path from 'path';

const logger = createLogger({
    level: 'info', // Set the log level (info, warn, error, debug)
    format: format.combine(
        format.timestamp(),
        format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [
        new transports.Console(), // Log to console
        new transports.File({ filename: path.join(__dirname, '../logs/error.log'), level: 'error' }), // Log errors to a file
        new transports.File({ filename: path.join(__dirname, '../logs/combined.log') }), // Log all messages to a file
    ],
});

export default logger;
