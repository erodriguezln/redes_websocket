import winston, { createLogger, format, transports } from 'winston';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

winston.addColors(colors);

const logger = createLogger({
  levels: levels,
  level: 'info', // dfault log level
  format: format.combine(
      format.colorize({all: true}),
      format.timestamp({format: 'HH:mm:ss'}),
      format.printf(({timestamp, level, message, ...meta}) => {
            return `${timestamp} [${level}]: ${message}`;
          },
      ),
  ),
  transports: [
    new transports.Console(),                // log to console
    //new transports.File({filename: 'app.log'}),  // log to file
  ],
});

export default logger;