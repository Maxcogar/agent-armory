const express = require('express');
const { auth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const { defaultLimiter } = require('../middleware/rateLimit');
const projectService = require('../services/projectService');

const router = express.Router();

router.use(defaultLimiter);

router.get('/', auth, async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const result = await projectService.listProjects(req.user.id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      status,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/', auth, validate(schemas.createProject), async (req, res, next) => {
  try {
    const project = await projectService.createProject(req.user.id, req.body);
    res.status(201).json({ success: true, data: { project } });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', auth, async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(req.params.id, req.user.id);
    res.json({ success: true, data: { project } });
  } catch (error) {
    if (error.message === 'Project not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    if (error.message === 'Access denied') {
      return res.status(403).json({ success: false, error: error.message });
    }
    next(error);
  }
});

router.patch('/:id', auth, validate(schemas.updateProject), async (req, res, next) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.user.id, req.body);
    res.json({ success: true, data: { project } });
  } catch (error) {
    if (error.message === 'Project not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    if (error.message === 'Insufficient permissions') {
      return res.status(403).json({ success: false, error: error.message });
    }
    next(error);
  }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const result = await projectService.deleteProject(req.params.id, req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error.message === 'Only the owner can delete a project') {
      return res.status(403).json({ success: false, error: error.message });
    }
    next(error);
  }
});

router.post('/:id/members', auth, async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    const project = await projectService.addMember(req.params.id, req.user.id, userId, role);
    res.json({ success: true, data: { project } });
  } catch (error) {
    if (error.message.includes('admin') || error.message.includes('already')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
});

module.exports = router;
