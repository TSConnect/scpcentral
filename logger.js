const path = require("path");
const log = require('electron-log');

log.transports.file.level = "info";
log.errorHandler.startCatching();

module.exports = log;