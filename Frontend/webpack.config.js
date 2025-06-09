const Dotenv = require('dotenv-webpack');
const path = require('path');

module.exports = {
  plugins: [
    new Dotenv({
      path: path.resolve(__dirname, '../.env'),
      systemvars: true,
      allowlist: ['GOOGLE_MAPS_API_KEY', 'API_URL']
    })
  ]
};
