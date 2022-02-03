const Joi = require("joi");
const _ = require("underscore");
const CONSTANTS = require("../constants");
const User = require("../models/user");
const UserRole = require("../models/userRole");
const Boom = require("@hapi/boom");
const { getEditableRoles, getRouteScope } = require("./helpers");

const internals = {};
internals.userSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.number()
    .integer()
    .valid(..._.values(CONSTANTS.userTypes)),
  email: Joi.string().email().required(),
  mobile: Joi.string().length(10).required(),
  password: Joi.binary().required(),
  partner_id: Joi.number().integer(),
});

module.exports = [
  {
    method: "POST",
    path: "/users/login/google",
    options: {
      description: "Login with googel account.",
      tags: ["api"],
      validate: {
        payload: {
          idToken: Joi.string().required(),
        },
      },
      handler: async (request) => {
        const { userService } = request.services();
        const user = await userService.googleLogin(request.payload.idToken);
        const userToken = await userService.createToken(user);
        return {
          user,
          userToken,
        };
      },
    },
  },
  {
    method: "POST",
    path: "/students/mobile/{userId}",
    options: {
      description: "get user mobile number for contact purpose.",
      tags: ["api"],
      validate: {
        payload: {
          mobile: User.field("mobile"),
        },
        params: {
          userId: User.field("id"),
        },
      },
      handler: async (request) => {
        const { userService } = request.services();
        const mobile = await userService.userMobileNumber(
          request.params.userId,
          request.payload
        );
        return {
          data: mobile,
        };
      },
    },
  },
  {
    method: "POST",
    path: "/users/login/credentials",
    options: {
      description: "Login with email/password combination.",
      tags: ["api"],
      validate: {
        payload: {
          email: Joi.string().email().required().lowercase(),
          password: Joi.string().required(),
        },
      },
      handler: async (request) => {
        const { userService } = request.services();
        // console.log(request);

        const { email, password } = request.payload;

        const user = await userService.login({ email, password });
        const token = await userService.createToken(user);

        return {
          token,
          user,
        };
      },
    },
  },
  {
    method: "GET",
    path: "/users/me",
    options: {
      auth: {
        strategy: "jwt",
        // access: {
        //   scope: ['team'],
        // },
      },
      description: "Get the details of a logged in user.",
      tags: ["api"],
      handler: async () => {
        const data = "Hello";
        return {
          data,
        };
      },
    },
  },

  {
    method: "GET",
    path: "/users",
    options: {
      auth: {
        strategy: "jwt",
        access: {
          scope: ["team", "student"],
        },
      },
      description: "Get all users details or particular type of user",
      tags: ["api"],
      validate: {
        query: {
          type: Joi.number()
            .integer()
            .valid(..._.values(CONSTANTS.userTypes)),
        },
      },
    },
    handler: async (request) => {
      const { userService } = request.services();

      if (request.query.type) {
        const user = await userService.findByType(request.query.type);
        return { data: user };
      }
      const users = await userService.findAll();
      return { data: users };
    },
  },

  {
    method: "POST",
    path: "/users",
    options: {
      auth: {
        strategy: "jwt",
        access: {
          scope: ["team"],
        },
      },
      description: "Create new user.",
      tags: ["api"],
      validate: {
        payload: internals.userSchema,
      },

      handler: async (request) => {
        const { userService } = request.services();
        const users = await userService.signUp(request.payload);
        await userService.sendSMSandEmailtoUser(request.payload);
        return { data: users };
      },
    },
  },

  {
    method: "PUT",
    path: "/users/{userId}",
    options: {
      description: "Update user details with the given ID.",
      tags: ["api"],
      validate: {
        params: {
          userId: Joi.number().integer(),
        },
        payload: internals.userSchema,
      },
      handler: async (request) => {
        const { userService } = request.services();
        const user = await userService.findById(request.params.userId);
        await userService.userUpdate(request.params.userId, request.payload);
        return { data: user };
      },
    },
  },

  {
    method: "GET",
    path: "/users/{userId}",
    options: {
      description: "Get user details given by userId.",
      tags: ["api"],
      validate: {
        params: {
          userId: Joi.number().integer(),
        },
      },

      handler: async (request) => {
        const { userService } = request.services();
        const user = await userService.findById(request.params.userId);
        return { data: user };
      },
    },
  },
  {
    method: "GET",
    path: "/users/getall",
    options: {
      description: "Get all users.",
      tags: ["api"],

      handler: async (request) => {
        const { userService } = request.services();
        const user = await userService.findAll();
        return { data: user };
      },
    },
  },
  {
    method: "GET",
    path: "/navgurukulAdvertisement",
    options: {
      description:
        "Send navgurkul advertisement message to all existing students.",
      tags: ["api"],
      handler: async (request) => {
        const { userService } = request.services();
        const sendAdd = await userService.navgurukulAdvertisement();
        return { data: sendAdd };
      },
    },
  },
  {
    method: "POST",
    path: "/users/{userId}/roles",
    options: {
      description: "Update user details with the given ID.",
      tags: ["api"],
      auth: {
        strategy: "jwt",
        access: {
          scope: ["admin"],
        },
      },
      validate: {
        params: {
          userId: Joi.number().integer(),
        },
        payload: Joi.object({
          rolesList: Joi.array().items(CONSTANTS.roles.all),
        }),
      },
      handler: async (request, h) => {
        const { userService, displayService } = request.services();
        const { userId } = request.params;

        // check if the current roles of the user gives them right to make the required changes
        const editableRolesForUser = getEditableRoles(
          request.auth.credentials.scope
        );
        const nonEditableRoles = _.difference(
          request.payload.rolesList,
          editableRolesForUser
        );
        if (nonEditableRoles.length > 0) {
          throw Boom.forbidden(
            `Logged in user doesn't have the right to edit ${nonEditableRoles.join(
              ","
            )} role(s).`
          );
        }
        const updateAndFetch = async (txn) => {
          // eslint-disable-next-line
          const [errInAddingRole, roleAdded] = await userService.addRoles(
            userId,
            request.payload.rolesList,
            txn
          );
          if (errInAddingRole) return [errInAddingRole, null];
          const [err, user] = await userService.findById(userId, txn);
          if (err) {
            return [err, null];
          }
          return [null, user];
        };

        const [err, user] = await h.context.transaction(updateAndFetch);
        if (err) {
          return h.response(err).code(err.code);
        }
        return { user };
      },
    },
  },
];
