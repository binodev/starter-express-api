module.exports = {
  type: 'user',
  singular: 'admin',
  plural: 'admins',
  basePath: 'admin',
  model: {
    name: 'Admin',
    attributes: {
      email: { type: String, unique: true },
      password: { type: String },
      fullname: { type: String },
      role: {
        type: String, 
        enum: ['superadmin', 'admin'], 
        default: 'admin'
      }
    }
  },
  auth: {
    register: 'none'
  }
}