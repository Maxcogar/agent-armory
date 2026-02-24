const express = require('express');
const { auth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimit');
const { registerUser, loginUser } = require('../services/authService');

const router = express.Router();

router.post('/register', authLimiter, validate(schemas.register), async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    const { user, token } = await registerUser({ email, password, name });
    res.status(201).json({
      success: true,
      data: { user, token },
    });
  } catch (error) {
    if (error.message === 'Email already registered') {
      return res.status(409).json({ success: false, error: error.message });
    }
    next(error);
  }
});

router.post('/login', authLimiter, validate(schemas.login), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await loginUser({ email, password });
    res.json({
      success: true,
      data: { user, token },
    });
  } catch (error) {
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({ success: false, error: error.message });
    }
    next(error);
  }
});

router.post('/logout', auth, (req, res) => {
  // Token-based auth: client discards the token
  res.json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
});

router.get('/me', auth, async (req, res, next) => {
  try {
    const { getUserById } = require('../services/userService');
    const user = await getUserById(req.user.id);
    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
