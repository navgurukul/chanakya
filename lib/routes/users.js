const Joi = require('joi');
const _ = require('underscore');
const CONSTANTS = require('../constants');
const User = require('../models/user');
const logger = require('../../server/logger');

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
    method: 'POST',
    path: '/users/login/google',
    options: {
      description: 'Login with googel account.',
      tags: ['api'],
      validate: {
        payload: Joi.object({
          idToken: Joi.string().required(),
        }),
      },
      handler: async (request) => {
        const { userService } = request.services();
        const user = await userService.googleLogin(request.payload.idToken);
        const userToken = await userService.createToken(user);
        logger.info('Login with googel account.');
        return {
          user,
          userToken,
        };
      },
    },
  },
  {
    method: 'POST',
    path: '/students/mobile/{userId}',
    options: {
      description: 'Get user mobile number for contact purpose.',
      tags: ['api'],
      validate: {
        payload: Joi.object({
          mobile: User.field('mobile'),
        }),
        params: Joi.object({
          userId: User.field('id'),
        }),
      },
      handler: async (request) => {
        const { userService } = request.services();
        const mobile = await userService.userMobileNumber(request.params.userId, request.payload);
        logger.info('Get user mobile number for contact purpose.');
        return {
          data: mobile,
        };
      },
    },
  },
  {
    method: 'POST',
    path: '/users/login/credentials',
    options: {
      description: 'Login with email/password combination.',
      tags: ['api'],
      validate: {
        payload: Joi.object({
          email: Joi.string().email().required().lowercase(),
          password: Joi.string().required(),
        }),
      },
      handler: async (request) => {
        const { userService } = request.services();
        // console.log(request);

        const { email, password } = request.payload;

        const user = await userService.login({ email, password });
        const token = await userService.createToken(user);
        logger.info('Login with email/password combination.');
        return {
          token,
          user,
        };
      },
    },
  },
  {
    method: 'GET',
    path: '/users/me',
    options: {
      auth: {
        strategy: 'jwt',
        // access: {
        //   scope: ['team'],
        // },
      },
      description: 'Get the details of a logged in user.',
      tags: ['api'],
      handler: async () => {
        const data = 'Hello';
        logger.info('Get the details of a logged in user.');
        return {
          data,
        };
      },
    },
  },

  {
    method: 'GET',
    path: '/users',
    options: {
      auth: {
        strategy: 'jwt',
        access: {
          scope: ['team', 'student'],
        },
      },
      description: 'Get all users details or particular type of user',
      tags: ['api'],
      validate: {
        query: Joi.object({
          type: Joi.number()
            .integer()
            .valid(..._.values(CONSTANTS.userTypes)),
        }),
      },
    },
    handler: async (request) => {
      const { userService } = request.services();

      if (request.query.type) {
        const user = await userService.findByType(request.query.type);
        logger.info('Get all users details or particular type of user');
        return { data: user };
      }
      const users = await userService.findAll();
      logger.info('Get all users details or particular type of user');
      return { data: users };
    },
  },

  {
    method: 'POST',
    path: '/users',
    options: {
      auth: {
        strategy: 'jwt',
        access: {
          scope: ['team'],
        },
      },
      description: 'Create new user.',
      tags: ['api'],
      validate: {
        payload: internals.userSchema,
      },

      handler: async (request) => {
        const { userService } = request.services();
        const users = await userService.signUp(request.payload);
        await userService.sendSMSandEmailtoUser(request.payload);
        logger.info('Create new user.');
        return { data: users };
      },
    },
  },

  {
    method: 'PUT',
    path: '/users/{userId}',
    options: {
      description: 'Update user details with the given ID.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          userId: Joi.number().integer(),
        }),
        payload: internals.userSchema,
      },
      handler: async (request) => {
        const { userService } = request.services();
        const user = await userService.findById(request.params.userId);
        await userService.userUpdate(request.params.userId, request.payload);
        logger.info('Update user details with the given ID.');
        return { data: user };
      },
    },
  },

  {
    method: 'GET',
    path: '/users/{userId}',
    options: {
      description: 'Get user details given by userId.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          userId: Joi.number().integer(),
        }),
      },

      handler: async (request) => {
        const { userService } = request.services();
        const user = await userService.findById(request.params.userId);
        logger.info('Get user details given by userId.');
        return { data: user };
      },
    },
  },
  {
    method: 'GET',
    path: '/users/getall',
    options: {
      description: 'Get all users.',
      tags: ['api'],

      handler: async (request) => {
        const { userService } = request.services();
        const user = await userService.findAll();
        logger.info('Get all users.');
        return { data: user };
      },
    },
  },
  {
    method: 'GET',
    path: '/navgurukulAdvertisement',
    options: {
      description: 'Send navgurkul advertisement message to all existing students.',
      tags: ['api'],
      handler: async (request) => {
        const { userService } = request.services();
        const sendAdd = await userService.navgurukulAdvertisement();
        logger.info('Send navgurkul advertisement message to all existing students.');
        return { data: sendAdd };
      },
    },
  },
];
