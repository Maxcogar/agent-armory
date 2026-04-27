const User = require('../models/User');
const { hashPassword } = require('./authService');

async function getUserById(id) {
  const user = await User.findById(id);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
}

async function listUsers({ page = 1, limit = 20, role, isActive } = {}) {
  const filter = {};
  if (role) filter.role = role;
  if (typeof isActive === 'boolean') filter.isActive = isActive;

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  return { users, total, page, limit };
}

async function updateUser(id, updates) {
  const allowed = ['name', 'avatar'];
  const filtered = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      filtered[key] = updates[key];
    }
  }

  const user = await User.findByIdAndUpdate(id, filtered, { new: true, runValidators: true });
  if (!user) {
    throw new Error('User not found');
  }
  return user;
}

async function deleteUser(id) {
  const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!user) {
    throw new Error('User not found');
  }
  return user;
}

async function changePassword(id, currentPassword, newPassword) {
  const user = await User.findById(id);
  if (!user) {
    throw new Error('User not found');
  }

  const { comparePassword } = require('./authService');
  const valid = await comparePassword(currentPassword, user.password);
  if (!valid) {
    throw new Error('Current password is incorrect');
  }

  user.password = await hashPassword(newPassword);
  await user.save();
  return { message: 'Password updated successfully' };
}

module.exports = {
  getUserById,
  listUsers,
  updateUser,
  deleteUser,
  changePassword,
};
