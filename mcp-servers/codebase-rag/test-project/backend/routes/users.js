const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const { defaultLimiter } = require('../middleware/rateLimit');
const userService = require('../services/userService');

const router = express.Router();

router.use(defaultLimiter);

router.get('/', auth, requireRole('admin'), async (req, res, next) => {
  try {
    const { page, limit, role, isActive } = req.query;
    const result = await userService.listUsers({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      role,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', auth, async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json({ success: true, data: { user } });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    next(error);
  }
});

router.patch('/:id', auth, validate(schemas.updateUser), async (req, res, next) => {
  try {
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Cannot update other users' });
    }
    const user = await userService.updateUser(req.params.id, req.body);
    res.json({ success: true, data: { user } });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    next(error);
  }
});

router.delete('/:id', auth, requireRole('admin'), async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);
    res.json({ success: true, data: { message: 'User deactivated' } });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/change-password', auth, async (req, res, next) => {
  try {
    if (req.params.id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Cannot change other user passwords' });
    }
    const { currentPassword, newPassword } = req.body;
    const result = await userService.changePassword(req.params.id, currentPassword, newPassword);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error.message === 'Current password is incorrect') {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
});

module.exports = router;
