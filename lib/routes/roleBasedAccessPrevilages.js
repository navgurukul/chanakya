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
      description: 'access privileges',
      tags: ['api'],
      validate: {},
      handler: async () => {
        const roleBaseAccess = {
          // students
          specialLogin: [
          'Tanusree.deb.barma@gmail.com',
          'armaangoyal@kpmg.com',
          'tinnasethi@kpmg.com'],
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
          roles: Joi.number().integer(),
          privilege: Joi.number().integer(),
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
          roles: Joi.number().integer(),
          privilege: Joi.number().integer(),
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
  {
    method:'GET',
    path:'/rolebaseaccess/mail',
    options: {
      description: 'roles previlige',
      tags: ['api'],
      handler: async(request) =>{
        const { rolebaseService } = request.services();
        const data = await rolebaseService.main();
        return data;
      }
    }
  },
  {
    method:'GET',
    path:'/rolebaseaccess/mail/{email}',
    options: {
      description: 'roles previlige by mail Id',
      tags: ['api'],
      validate: {
        params: Joi.object({"email":Joi.string()}),
      },
      handler: async(request) =>{
        const { rolebaseService } = request.services();
        const data = await rolebaseService.findById(request.params.email);
        return data;
      }
    }
  }, {
    method:'Post',
    path:'/role/createRole',
    options: {
      description: 'roles a new Role',
      tags: ['api'],
      validate: {
        payload: Joi.object({
          roles:Joi.string(),
          description: Joi.string(),
        }),
      },
      handler: async(request) =>{
        const { rolebaseService } = request.services();
        const data = await rolebaseService.createRole(request.payload);
        return data;
      }
    }
  }, {
    method:'Post',
    path:'/role/createUserRole',
    options: {
      description: 'roles a new User Role',
      tags: ['api'],
      validate: {
        payload: Joi.object({
          "chanakya_user_email_id":Joi.number().integer(),
          "roles":Joi.number().integer(),
          "privilege":Joi.number().integer(),
      }),
      },
      handler: async(request) =>{
        const { rolebaseService } = request.services();
        const data = await rolebaseService.insertUserRole(request.payload);
        return data;
      }
    }
  }, {
    method:'DELETE',
    path:'/role/deleteUserRole/{id}',
    options: {
      description: 'roles a new User Role',
      tags: ['api'],
      validate: {
        params: Joi.object({
          "id":Joi.number().integer()
      }),
      },
      handler: async(request) =>{
        const { rolebaseService } = request.services();
        const data = await rolebaseService.deleteUserRole(request.params.id);
        return data;
      }
    }
  }, {
    method:'Post',
    path:'/role/createUserRoleAccess',
    options: {
      description: 'roles a new User Role access',
      tags: ['api'],
      validate: {
        payload: Joi.object({
          "user_role_id":Joi.number().integer(),
          "access":Joi.number().integer(),
      }),
      },
      handler: async(request) =>{
        const { rolebaseService } = request.services();
        const data = await rolebaseService.addAccess(request.payload);
        return data;
      }
    }
  }, {
    method:'DELETE',
    path:'/role/deleteUserRoleAccess/{id}',
    options: {
      description: 'delete a User Role access',
      tags: ['api'],
      validate: {
        params: Joi.object({
          "id":Joi.number().integer()
      }),
      },
      handler: async(request) =>{
        const { rolebaseService } = request.services();
        const data = await rolebaseService.deleteUserAccess(request.params.id);
        return data;
      }
    }
  }, {
    method:'DELETE',
    path:'/role/deleteUserEmail/{id}',
    options: {
      description: 'delete User Email',
      tags: ['api'],
      validate: {
        params: Joi.object({
          "id":Joi.number().integer(),
      }),
      },
      handler: async(request) =>{
        const { rolebaseService } = request.services();
        const data = await rolebaseService.deleteUserEmail(request.params.id);
        return data;
      }
    }
  },{
    method:'Post',
    path:'/role/createUserEmail',
    options: {
      description: 'create a new User Email',
      tags: ['api'],
      validate: {
        payload: Joi.object({
          "email":Joi.string(),
      }),
      },
      handler: async(request) =>{
        const { rolebaseService } = request.services();
        const data = await rolebaseService.addUserEmail(request.payload);
        return data;
      }
    }
  },{
    method:'Post',
    path:'/role/createPrivilege',
    options: {
      description: 'roles a new privilege',
      tags: ['api'],
      validate: {
        payload: Joi.object({
          privilege:Joi.string(),
          description: Joi.string(),
        }), 
      },
      handler: async(request) =>{
        const { rolebaseService } = request.services();
        return await rolebaseService.createPrivilege(request.payload);
        
      }
    }
  }, {
    method:'Put',
    path:'/role/updateRole/{roleId}',
    options: {
      description: 'roles a new Role',
      tags: ['api'],
      validate: {
        params: Joi.object({"roleId":Joi.number().integer()}),
        payload: Joi.object({
          role:Joi.string(),
          description: Joi.string(),
        }),
      },
      handler: async(request) =>{
        const { rolebaseService } = request.services();
        // const data = await rolebaseService.findById(request.params.email);
        return [];
      }
    }
  },{
    method:'Put',
    path:'/role/updatePrivilege/{privilegeId}',
    options: {
      description: 'roles a new privilege',
      tags: ['api'],
      validate: {
        params: Joi.object({"privilegeId":Joi.number().integer()}),
        payload: Joi.object({
          privilege:Joi.string(),
          description: Joi.string(),
        }),
      },
      handler: async(request) =>{
        const { rolebaseService } = request.services();
        // const data = await rolebaseService.findById(request.params.email);
        return [];
      }
    }
  }, {
    method:'Get',
    path:'/role/getRole',
    options: {
      description: 'get all Role',
      tags: ['api'],
     
      handler: async(request) =>{
        const { rolebaseService } = request.services();
        const data = await rolebaseService.getAllRoles();
        return data;
      }
    }
  },{
    method:'Get',
    path:'/role/getPrivilege',
    options: {
      description: 'get all privilege',
      tags: ['api'],
      
      handler: async(request) =>{
        const { rolebaseService } = request.services();
        const data = await rolebaseService.getPrivilege();
        return data;
      }
    }
  },
];
