const Project = require('../models/Project');

async function createProject(ownerId, data) {
  const project = await Project.create({
    ...data,
    owner: ownerId,
    members: [{ user: ownerId, role: 'admin' }],
  });
  return project;
}

async function getProjectById(projectId, userId) {
  const project = await Project.findById(projectId)
    .populate('owner', 'name email')
    .populate('members.user', 'name email');

  if (!project) {
    throw new Error('Project not found');
  }

  const isMember = project.members.some(
    (m) => m.user._id.toString() === userId.toString()
  );
  if (!project.settings.isPublic && !isMember) {
    throw new Error('Access denied');
  }

  return project;
}

async function listProjects(userId, { page = 1, limit = 20, status } = {}) {
  const filter = { 'members.user': userId };
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate('owner', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ updatedAt: -1 }),
    Project.countDocuments(filter),
  ]);

  return { projects, total, page, limit };
}

async function updateProject(projectId, userId, updates) {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  const member = project.members.find(
    (m) => m.user.toString() === userId.toString()
  );
  if (!member || !['admin', 'editor'].includes(member.role)) {
    throw new Error('Insufficient permissions');
  }

  const allowed = ['name', 'description', 'status', 'tags', 'settings'];
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      project[key] = updates[key];
    }
  }

  await project.save();
  return project;
}

async function deleteProject(projectId, userId) {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error('Project not found');
  }
  if (project.owner.toString() !== userId.toString()) {
    throw new Error('Only the owner can delete a project');
  }

  await Project.findByIdAndDelete(projectId);
  return { message: 'Project deleted' };
}

async function addMember(projectId, userId, targetUserId, role = 'viewer') {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  const member = project.members.find(
    (m) => m.user.toString() === userId.toString()
  );
  if (!member || member.role !== 'admin') {
    throw new Error('Only admins can add members');
  }

  const alreadyMember = project.members.some(
    (m) => m.user.toString() === targetUserId.toString()
  );
  if (alreadyMember) {
    throw new Error('User is already a member');
  }

  project.members.push({ user: targetUserId, role });
  await project.save();
  return project;
}

module.exports = {
  createProject,
  getProjectById,
  listProjects,
  updateProject,
  deleteProject,
  addMember,
};
