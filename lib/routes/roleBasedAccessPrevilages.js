const Joi = require('joi');
const { permissions, campus, superAdmin } = require('../config');

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
      description: 'access previleges',
      tags: ['api'],
      validate: {},
      handler: async () => {
        const roleBaseAccess = {
          // students
          specialLogin: ['Tanusree.deb.barma@gmail.com'],
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
            roleBaseAccess.campus[i.name].view.push(
              'Tanusree.deb.barma@gmail.com'
            );
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

        return roleBaseAccess;
      },
    },
  },

  {
    method: 'GET',
    path: '/rolebaseaccess/email',
    options: {
      description: 'emails roles access previleges',
      tags: ['api'],
      validate: {},
      handler: async (request) => {
        const { rolebaseService } = request.services();
        const data = await rolebaseService.findall();
        return data;
      },
    },
  },
  {
    method: 'POST',
    path: '/rolebaseaccess/email/add',
    options: {
      description: 'emails roles access previleges',
      tags: ['api'],
      validate: {
        payload: Joi.object({
          email: Joi.string(),
          roles: Joi.array(),
          privilege: Joi.array(),
        }),
      },
      handler: async (request) => {
        const { rolebaseService } = request.services();
        const data = await rolebaseService.addUser(request.payload);
        return data;
      },
    },
  },
  {
    method: 'PUT',
    path: '/rolebaseaccess/email/update/{id}',
    options: {
      description: 'emails roles access previleges',
      tags: ['api'],
      validate: {
        params: Joi.object({ id: Joi.number().integer().greater(0) }),
        payload: Joi.object({
          email: Joi.string(),
          roles: Joi.array(),
          privilege: Joi.array(),
        }),
      },
      handler: async (request) => {
        const { rolebaseService } = request.services();
        const data = await rolebaseService.updateUser(
          request.payload,
          request.params.id
        );
        return data;
      },
    },
  },
  {
    method: 'DELETE',
    path: '/rolebaseaccess/email/delete/{id}',
    options: {
      description: 'emails roles access previleges',
      tags: ['api'],
      validate: {
        params: Joi.object({ id: Joi.number().integer().greater(0) }),
      },
      handler: async (request) => {
        const { rolebaseService } = request.services();
        const data = await rolebaseService.delete(request.params.id);
        return data;
      },
    },
  },
];
