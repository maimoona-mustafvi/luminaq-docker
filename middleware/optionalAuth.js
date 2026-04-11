const jwt = require('jsonwebtoken');

// Optional auth — sets req.userId if token present, but doesn't block
module.exports = function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    req.userId = null;
    return next();
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
  } catch {
    req.userId = null;
  }
  next();
};
