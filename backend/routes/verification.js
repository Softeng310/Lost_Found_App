const express = require('express');
const crypto = require('node:crypto');
const authenticate = require('../middleware/auth');
const { sendVerificationCodeEmail } = require('../email');

const router = express.Router();

// Helper to generate a numeric code of given length
function generateNumericCode(length = 6) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

function hashCode(code, salt) {
  return crypto.createHash('sha256').update(`${code}:${salt}`).digest('hex');
}

// Request a verification code sent to user's university email
router.post('/request-code', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { upi } = req.body || {};
    const user = req.user; // Firebase decoded token

    if (!upi || typeof upi !== 'string' || upi.trim().length < 3) {
      return res.status(400).json({ message: 'Invalid UPI' });
    }

    // Build university email from UPI (assumption per requirements)
    const email = `${upi}@aucklanduni.ac.nz`;

    const usersRef = db.collection('users').doc(user.uid);
    const userSnap = await usersRef.get();
    if (!userSnap.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
    const code = generateNumericCode(4); // As per example 5678
    const salt = crypto.randomBytes(8).toString('hex');
    const codeHash = hashCode(code, salt);

    // Store pending verification state on the user document
    await usersRef.set({
      upi,
      verification: {
        method: 'email',
        target: email,
        codeHash,
        salt,
        expiresAt: expiresAt.toISOString(),
        attempts: 0,
        status: 'pending',
        requestedAt: now.toISOString(),
      }
    }, { merge: true });

    // Send the email
    await sendVerificationCodeEmail(email, code, { appName: 'Lost & Found' });

    return res.json({ message: 'Verification code sent', target: email, expiresAt });
  } catch (err) {
    console.error('request-code error:', err);
    return res.status(500).json({ message: 'Failed to send verification code' });
  }
});

// Verify a code
router.post('/verify-code', authenticate, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { code } = req.body || {};
    const user = req.user;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ message: 'Code is required' });
    }

    const usersRef = db.collection('users').doc(user.uid);
    const userSnap = await usersRef.get();
    if (!userSnap.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const data = userSnap.data() || {};
    const vf = data.verification;
    if (!vf || !vf.codeHash || !vf.salt || !vf.expiresAt) {
      return res.status(400).json({ message: 'No pending verification' });
    }

    // Check expiry
    const now = new Date();
    const exp = new Date(vf.expiresAt);
    if (now > exp) {
      await usersRef.set({ verification: { ...vf, status: 'expired' } }, { merge: true });
      return res.status(400).json({ message: 'Code expired' });
    }

    // Check attempts limit
    const attempts = Number(vf.attempts || 0);
    if (attempts >= 5) {
      await usersRef.set({ verification: { ...vf, status: 'locked' } }, { merge: true });
      return res.status(429).json({ message: 'Too many attempts. Please request a new code.' });
    }

    // Verify code
    const attemptedHash = hashCode(code, vf.salt);
    if (attemptedHash !== vf.codeHash) {
      await usersRef.set({ verification: { ...vf, attempts: attempts + 1 } }, { merge: true });
      return res.status(400).json({ message: 'Invalid code' });
    }

    // Mark verified and clear sensitive fields
    await usersRef.set({
      isVerified: true,
      trustBadge: 'verified',
      verification: {
        method: 'email',
        target: vf.target,
        status: 'verified',
        verifiedAt: new Date().toISOString()
      }
    }, { merge: true });

    return res.json({ message: 'Verification successful', isVerified: true });
  } catch (err) {
    console.error('verify-code error:', err);
    return res.status(500).json({ message: 'Failed to verify code' });
  }
});

module.exports = router;
