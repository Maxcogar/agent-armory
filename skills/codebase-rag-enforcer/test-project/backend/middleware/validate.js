const { validationResult, checkSchema } = require('express-validator');

function validate(schema) {
  return [
    ...checkSchema(schema),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array().map((e) => ({
            field: e.path,
            message: e.msg,
          })),
        });
      }
      next();
    },
  ];
}

const schemas = {
  login: {
    email: { isEmail: true, errorMessage: 'Valid email required' },
    password: { notEmpty: true, errorMessage: 'Password required' },
  },
  register: {
    email: { isEmail: true, errorMessage: 'Valid email required' },
    password: { isLength: { options: { min: 8 } }, errorMessage: 'Password must be 8+ characters' },
    name: { notEmpty: true, trim: true, errorMessage: 'Name required' },
  },
  updateUser: {
    name: { optional: true, trim: true, notEmpty: true },
    avatar: { optional: true, isURL: true },
  },
  createProject: {
    name: { notEmpty: true, trim: true, errorMessage: 'Project name required' },
    description: { optional: true, trim: true },
  },
  updateProject: {
    name: { optional: true, trim: true, notEmpty: true },
    description: { optional: true, trim: true },
    status: { optional: true, isIn: { options: [['active', 'archived', 'draft']] } },
  },
};

module.exports = { validate, schemas };
