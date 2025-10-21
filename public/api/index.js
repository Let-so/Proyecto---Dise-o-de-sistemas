// public/api/index.js
// Entry point for Vercel serverless functions to reuse the Express app
const app = require('../../index');

module.exports = (req, res) => app(req, res);
