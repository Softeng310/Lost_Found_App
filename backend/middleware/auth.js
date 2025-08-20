const admin = require('firebase-admin');

async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const m = header.match(/^Bearer (.+)$/);
  if (!m) return res.status(401).json({ message: 'Missing Authorization header' });

  try {
    const decoded = await admin.auth().verifyIdToken(m[1]);
    req.user = decoded; // contains uid, email, etc.
    next();
  } catch (err) {
    console.error('verifyIdToken error:', err);
    return res.status(401).json({ message: 'Invalid token' });
  }
}

module.exports = authenticate;
