module.exports = {
    type: 'resource',
    singular: 'audit',
    plural: 'audits',
    basePath: 'audit',
    model: {
      name: 'Audit',
      attributes: {
        user: { ref: 'User' },
        statut: {
            type: String,
            enum: ['En attente', 'En cours', 'Terminé'],
            default: 'En attente'
          }
      }
    },
      references: 'user'
  ,
    auth: {
      register: 'none'
    }
  }