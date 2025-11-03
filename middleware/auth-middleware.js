const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const bearer = authHeader.split(' ')[1];
  const token = bearer || req.cookies?.token;

  if (!token) return res.status(401).json({ error: 'auth_required' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'token_expired_or_invalid' });
  }
}

module.exports = { requireAuth };
