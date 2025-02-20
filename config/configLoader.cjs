let config;

try {
  config = require('./config.cjs');
} catch (error) {
  console.warn('config.cjs not found, using config.template.cjs');
  config = require('./config.template.cjs');
}

module.exports = config;