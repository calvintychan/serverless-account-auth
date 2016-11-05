export default function() {
  const config = require('./config.json');
  Object.keys(config).forEach((key) => {
    const value = config[key];
    process.env[key] = value;
  });
};
