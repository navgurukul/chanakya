const Joi = require('joi');
const { permissions, campus, superAdmin } = require('../config');
const logger = require('../../server/logger');

const commonPermissions = [
  ...permissions.updateStage,
  ...permissions.addOrUpdateContact,
  ...permissions.updateStudentName,
  ...superAdmin,
];
module.exports = [
  {
    method: 'GET',
    path: '/rolebaseaccess',
    options: {
      description: 'Access privileges',
      tags: ['api'],
      validate: {},
      handler: async () => {
        const roleBaseAccess = {
          // students
          specialLogin: [
            'Tanusree.deb.barma@gmail.com',
            'armaangoyal@kpmg.com',
            'tinnasethi@kpmg.com',
          ],
          students: {
            view: commonPermissions,
            update: {
              name: [],
              email: [],
              stage: [],
              campus: [],
              partner: [],
              donor: [],
              transitions: {
                owner: [],
                feedback: [],
                deleteStage: [],
                when: [],
                finished: [],
                status: [],
              },
            },
          },

          // campus
          campus: {
            view: ['Tanusree.deb.barma@gmail.com', ...commonPermissions],
          },

          // partners
          partners: {
            view: ['Tanusree.deb.barma@gmail.com', ...commonPermissions],
            update: {
              partnerDetails: [],
              // redirectPartnerID: [],
              createAssessment: [],
              viewAssessment: [],
              joinedStudentsProgress: [],
              onlineTestForPartner: [],
              merakiLink: [],
              sendReport: [],
            },
          },
        };
        for (const i of campus) {
          roleBaseAccess.campus[i.name] = {
            update: {
              name: [],
              email: [],
              stage: [],
              partner: [],
              donor: [],
              evaluation: [],
              transitions: {
                owner: [],
                feedback: [],
                deleteStage: [],
                startDate: [],
                endDate: [],
                status: [],
              },
            },
            view: commonPermissions,
          };
          if (i.name === 'Tripura') {
            roleBaseAccess.campus[i.name].view.push('Tanusree.deb.barma@gmail.com');
          }
        }
        roleBaseAccess.campus.All = {
          view: commonPermissions,
          update: {
            name: [],
            email: [],
            stage: [],
            partner: [],
            donor: [],
            evaluation: [],
            transitions: {
              owner: [],
              feedback: [],
              deleteStage: [],
              startDate: [],
              endDate: [],
              status: [],
            },
          },
        };
        logger.info('Access privileges');
        return roleBaseAccess;
      },
    },
  },

  {
    method: 'GET',
    path: '/rolebaseaccess/email',
    options: {
      description: 'Emails roles access previleges',
      tags: ['api'],
      validate: {},
      handler: async (request) => {
        const { rolebaseService } = request.services();
        const data = await rolebaseService.findall();
        logger.info('Emails roles access previleges');
        return data;
      },
    },
  },
  {
    method: 'POST',
    path: '/rolebaseaccess/email/add',
    options: {
      description: 'Emails roles access previleges',
      tags: ['api'],
      validate: {
        payload: Joi.object({
          email: Joi.string(),
          roles: Joi.number().integer(),
          privilege: Joi.number().integer(),
        }),
      },
      handler: async (request) => {
        const { rolebaseService } = request.services();
        const data = await rolebaseService.addUser(request.payload);
        logger.info('Emails roles access previleges');
        return data;
      },
    },
  },
  {
    method: 'PUT',
    path: '/rolebaseaccess/email/update/{id}',
    options: {
      description: 'Emails roles access previleges',
      tags: ['api'],
      validate: {
        params: Joi.object({ id: Joi.number().integer().greater(0) }),
        payload: Joi.object({
          email: Joi.string(),
          roles: Joi.number().integer(),
          privilege: Joi.number().integer(),
        }),
      },
      handler: async (request) => {
        const { rolebaseService } = request.services();
        const data = await rolebaseService.updateUser(request.payload, request.params.id);
        logger.info('Emails roles access previleges');
        return data;
      },
    },
  },
  {
    method: 'DELETE',
    path: '/rolebaseaccess/email/delete/{id}',
    options: {
      description: 'Emails roles access previleges',
      tags: ['api'],
      validate: {
        params: Joi.object({ id: Joi.number().integer().greater(0) }),
      },
      handler: async (request) => {
        const { rolebaseService } = request.services();
        const data = await rolebaseService.delete(request.params.id);
        logger.info('Emails roles access previleges');
        return data;
      },
    },
  },
  {
    method: 'GET',
    path: '/rolebaseaccess/mail',
    options: {
      description: 'Roles previlige',
      tags: ['api'],
      handler: async (request) => {
        const { rolebaseService } = request.services();
        const data = await rolebaseService.main();
        logger.info('Roles previlige');
        return data;
      },
    },
  },
  {
    method: 'GET',
    path: '/rolebaseaccess/mail/{email}',
    options: {
      description: 'Roles previlige by mail Id',
      tags: ['api'],
      validate: {
        params: Joi.object({ email: Joi.string() }),
      },
      handler: async (request) => {
        const { rolebaseService } = request.services();
        const data = await rolebaseService.findById(request.params.email);
        logger.info('Roles previlige by mail Id');
        return data;
      },
    },
  },
  {
    method: 'Post',
    path: '/role/createRole',
    options: {
      description: 'Roles a new Role',
      tags: ['api'],
      validate: {
        payload: Joi.object({
          roles: Joi.string(),
          description: Joi.string(),
        }),
      },
      handler: async (request) => {
        const { rolebaseService } = request.services();
        const data = await rolebaseService.createRole(request.payload);
        logger.info('Roles a new Role');
        return data;
      },
    },
  },
  {
    method: 'Post',
    path: '/role/createUserRole',
    options: {
      description: 'Roles a new User Role',
      tags: ['api'],
      validate: {
        payload: Joi.object({
          chanakya_user_email_id: Joi.number().integer(),
          roles: Joi.number().integer(),
          privilege: Joi.number().integer(),
        }),
      },
      handler: async (request) => {
        const { rolebaseService } = request.services();
        const data = await rolebaseService.insertUserRole(request.payload);
        logger.info('Roles a new User Role');
        return data;
      },
    },
  },
  {
    method: 'DELETE',
    path: '/role/deleteUserRole/{id}',
    options: {
      description: 'Roles a new User Role',
      tags: ['api'],
      validate: {
        params: Joi.object({
          id: Joi.number().integer(),
        }),
      },
      handler: async (request) => {
        const { rolebaseService } = request.services();
        const data = await rolebaseService.deleteUserRole(request.params.id);
        logger.info('Roles a new User Role');
        return data;
      },
    },
  },
  {
    method: 'Post',
    path: '/role/createUserRoleAccess',
    options: {
      description: 'Roles a new User Role access',
      tags: ['api'],
      validate: {
        payload: Joi.object({
          user_role_id: Joi.number().integer(),
          access: Joi.number().integer(),
        }),
      },
      handler: async (request) => {
        const { rolebaseService } = request.services();
        const data = await rolebaseService.addAccess(request.payload);
        logger.info('Roles a new User Role access');
        return data;
      },
    },
  },
  {
    method: 'DELETE',
    path: '/role/deleteUserRoleAccess/{id}',
    options: {
      description: 'Delete a User Role access',
      tags: ['api'],
      validate: {
        params: Joi.object({
          id: Joi.number().integer(),
        }),
      },
      handler: async (request) => {
        const { rolebaseService } = request.services();
        const data = await rolebaseService.deleteUserAccess(request.params.id);
        logger.info('Delete a User Role access');
        return data;
      },
    },
  },
  {
    method: 'DELETE',
    path: '/role/deleteUserEmail/{id}',
    options: {
      description: 'Delete User Email',
      tags: ['api'],
      validate: {
        params: Joi.object({
          id: Joi.number().integer(),
        }),
      },
      handler: async (request) => {
        const { rolebaseService } = request.services();
        const data = await rolebaseService.deleteUserEmail(request.params.id);
        logger.info('Delete User Email');
        return data;
      },
    },
  },
  {
    method: 'Post',
    path: '/role/createUserEmail',
    options: {
      description: 'Create a new User Email',
      tags: ['api'],
      validate: {
        payload: Joi.object({
          email: Joi.string(),
        }),
      },
      handler: async (request) => {
        const { rolebaseService } = request.services();
        const data = await rolebaseService.addUserEmail(request.payload);
        logger.info('Create a new User Email');
        return data;
      },
    },
  },
  {
    method: 'Post',
    path: '/role/createPrivilege',
    options: {
      description: 'Roles a new privilege',
      tags: ['api'],
      validate: {
        payload: Joi.object({
          privilege: Joi.string(),
          description: Joi.string(),
        }),
      },
      handler: async (request) => {
        const { rolebaseService } = request.services();
        logger.info('Roles a new privilege');
        return await rolebaseService.createPrivilege(request.payload);
      },
    },
  },
  {
    method: 'Put',
    path: '/role/updateRole/{roleId}',
    options: {
      description: 'Roles a new Role',
      tags: ['api'],
      validate: {
        params: Joi.object({ roleId: Joi.number().integer() }),
        payload: Joi.object({
          role: Joi.string(),
          description: Joi.string(),
        }),
      },
      handler: async (request) => {
        const { rolebaseService } = request.services();
        // const data = await rolebaseService.findById(request.params.email);
        logger.info('Roles a new Role');
        return [];
      },
    },
  },
  {
    method: 'Put',
    path: '/role/updatePrivilege/{privilegeId}',
    options: {
      description: 'Roles a new privilege',
      tags: ['api'],
      validate: {
        params: Joi.object({ privilegeId: Joi.number().integer() }),
        payload: Joi.object({
          privilege: Joi.string(),
          description: Joi.string(),
        }),
      },
      handler: async (request) => {
        const { rolebaseService } = request.services();
        // const data = await rolebaseService.findById(request.params.email);
        logger.info('Roles a new privilege');
        return [];
      },
    },
  },
  {
    method: 'Get',
    path: '/role/getRole',
    options: {
      description: 'Get all Role',
      tags: ['api'],

      handler: async (request) => {
        const { rolebaseService } = request.services();
        const data = await rolebaseService.getAllRoles();
        logger.info('Get all Role');
        return data;
      },
    },
  },
  {
    method: 'Get',
    path: '/role/getPrivilege',
    options: {
      description: 'Get all privilege',
      tags: ['api'],

      handler: async (request) => {
        const { rolebaseService } = request.services();
        const data = await rolebaseService.getPrivilege();
        logger.info('Get all privilege');
        return data;
      },
    },
  },
];
