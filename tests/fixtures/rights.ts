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
          roleId: "assetsGroup.admin",
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
          roleId: "assetsGroup.admin",
          restrictedTo: {},
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
  },
};
