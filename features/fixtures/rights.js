module.exports = {
  roles: {
    anonymous: {
      controllers: {
        '*': {
          actions: {
            '*': true
          }
        },
        server: {
          actions: {
            now: false
          }
        }
      }
    }
  },
  users: {
    melis: {
      content: {
        profileIds: ['default']
      },
      credentials: {
        local: {
          username: 'melis',
          password: 'password'
        }
      }
    }
  }
};
