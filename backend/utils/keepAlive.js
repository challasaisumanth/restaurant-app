const https = require('https');

const keepAlive = () => {
  setInterval(() => {
    https.get('https://restaurant-app-backend-ui3j.onrender.com', (res) => {
      console.log(`Keep alive ping: ${res.statusCode}`);
    }).on('error', (err) => {
      console.log('Keep alive error:', err.message);
    });
  }, 14 * 60 * 1000); // ping every 14 minutes

  console.log('Keep alive job started');
};

module.exports = keepAlive;