const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const config = require('config');

const logFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.align(),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
);

// const logger = winston.createLogger({
//   level: 'info',
//   format: winston.format.json(),
//   defaultMeta: { service: 'user-service' },
//   transports: [
//     //
//     // - Write all logs with importance level of `error` or less to `error.log`
//     // - Write all logs with importance level of `info` or less to `combined.log`
//     //
//     new winston.transports.File({ filename: 'error.log', level: 'error' }),
//     new winston.transports.File({ filename: 'combined.log' }),
//   ],
// });
// if (process.env.NODE_ENV !== 'production') {
//   logger.add(
//     new winston.transports.Console({
//       format: winston.format.simple(),
//     })
//   );
// }

const transport = new DailyRotateFile({
  filename: config.get('logConfig.logFolder') + config.get('logConfig.logFile'),
  datePattern: `YYYY-MM-DD-HH`,
  zippedArchive: true,
  maxSize: `50m`,
  maxFiles: `20`,
  prepend: true,
  level: config.get('logConfig.logLevel'),
});

// eslint-disable-next-line
transport.on(`rotate`, function (oldFilename, newFilename) {
  // call function like upload to s3 or on cloud
});
const logger = winston.createLogger({
  format: logFormat,
  transports: [
    transport,
   
      new winston.transports.Console({
        level: 'info',
      }),
    
  ],
});
module.exports = logger;
