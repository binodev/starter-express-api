module.exports = {
    type: 'resource',
    singular: 'comparaison',
    plural: 'comparaisons',
    basePath: 'comparaison',
    model: {
      name: 'Comparaison',
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