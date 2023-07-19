module.exports = {
    type: 'resource',
    singular: 'conversation',
    plural: 'conversations',
    basePath: 'conversation',
    model: {
      name: 'Conversation',
      attributes: {
        user: { ref: 'User' },
        history:[
            {
                role: { type: String, enum: ['user', 'assistant','system'] },
                content: String,
                timestamp: { type: Date, default: Date.now }
              }
        ]
      }
    },
      references: 'user'
  ,
    auth: {
      register: 'none'
    }
  }