const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const SALT_ROUNDS = 12;

async function hashPassword(plaintext) {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

async function comparePassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash);
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

async function registerUser({ email, password, name }) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new Error('Email already registered');
  }

  const hashed = await hashPassword(password);
  const user = await User.create({ email, password: hashed, name });

  const token = signToken({ id: user._id, email: user.email, role: user.role });
  return { user, token };
}

async function loginUser({ email, password }) {
  const user = await User.findOne({ email, isActive: true });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    throw new Error('Invalid credentials');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken({ id: user._id, email: user.email, role: user.role });
  return { user, token };
}

module.exports = {
  hashPassword,
  comparePassword,
  signToken,
  verifyToken,
  registerUser,
  loginUser,
};
