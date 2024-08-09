// src/logger.js
import log from 'loglevel';

// Set the default log level. Options are: trace, debug, info, warn, error, silent
log.setDefaultLevel('warn');
log.setLevel('warn');
// If you want to change the log level dynamically based on environment variables or other conditions:
// if (process.env.NODE_ENV === 'development') {
//   log.setLevel('debug');
// } else {
//   log.setLevel('warn');
// }

export default log;
