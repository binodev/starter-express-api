module.exports = {
    type: 'user',
    singular: 'user',
    plural: 'users',
    basePath: 'user',
    model: {
      name: 'User',
      attributes: {
        username: { type: String,unique: true },
        password: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        statut: { type: String },
        firstName: { type: String },
        lastName: { type: String },
        adresse: { type: String },
      }
    },
    virtuals:[['audits', {
        ref: 'Audit',
        localField: '_id',
        foreignField: 'user',
      }],['comparaisons', {
        ref: 'Comparaison',
        localField: '_id',
        foreignField: 'user',
      }]],
      references: ['audits','comparaisons']
  ,
    auth: {
      register: 'none'
    }
  }