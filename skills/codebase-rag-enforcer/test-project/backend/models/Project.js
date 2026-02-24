const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['viewer', 'editor', 'admin'], default: 'viewer' },
      },
    ],
    status: {
      type: String,
      enum: ['active', 'archived', 'draft'],
      default: 'draft',
    },
    tags: [{ type: String, trim: true }],
    settings: {
      isPublic: { type: Boolean, default: false },
      allowComments: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

projectSchema.index({ owner: 1, status: 1 });
projectSchema.index({ 'members.user': 1 });
projectSchema.index({ tags: 1 });

projectSchema.virtual('memberCount').get(function () {
  return this.members.length;
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
