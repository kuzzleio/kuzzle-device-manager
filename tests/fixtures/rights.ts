export default {
  users: {
    "test-admin": {
      content: {
        profileIds: ["admin"],
      },
      credentials: {
        local: {
          username: "test-admin",
          password: "password",
        },
      },
    },
    "ayse-admin": {
      content: {
        profileIds: ["ayse-admin"],
      },
      credentials: {
        local: {
          username: "ayse-admin",
          password: "password",
        },
      },
    },
    "default-user": {
      content: {
        profileIds: ["default-user"],
      },
      credentials: {
        local: { username: "default-user", password: "password" },
      },
    },
  },
  profiles: {
    "ayse-admin": {
      rateLimit: 0,
      policies: [
        {
          roleId: "tests",
        },
        {
          roleId: "assets.admin",
          restrictedTo: [
            {
              index: "engine-ayse",
            },
          ],
        },
        {
          roleId: "devices.admin",
          restrictedTo: [
            {
              index: "engine-ayse",
            },
          ],
        },
        {
          roleId: "group.admin",
          restrictedTo: [
            {
              index: "engine-ayse",
            },
          ],
        },
      ],
      optimizedPolicies: [
        {
          roleId: "assets.admin",
          restrictedTo: {},
        },
        {
          roleId: "devices.admin",
          restrictedTo: {},
        },
        {
          roleId: "group.admin",
          restrictedTo: {},
        },
      ],
    },
    "default-user": {
      rateLimit: 0,
      policies: [
        {
          roleId: "default-user",
        },
      ],
      optimizedPolicies: [
        {
          roleId: "default-user",
        },
      ],
    },
  },

  roles: {
    tests: {
      controllers: {
        admin: {
          actions: {
            loadFixtures: true,
          },
        },
        collection: {
          actions: {
            refresh: true,
          },
        },
        document: {
          actions: {
            get: true,
            deleteByQuery: true,
          },
        },
      },
    },
    "default-user": {
      controllers: {
        "device-manager/assets": {
          actions: {
            "*": true,
          },
        },
      },
    },
  },
};
