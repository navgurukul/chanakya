const { permissions, campus, superAdmin } = require("../config");
// console.log(permissions)
const Joi = require("joi");

const commonPermissions = [
  ...permissions.updateStage,
  ...permissions.addOrUpdateContact,
  ...permissions.updateStudentName,
  ...superAdmin,
];
module.exports = [
  {
    method: "GET",
    path: "/rolebaseaccess",
    options: {
      description: "access previleges",
      tags: ["api"],
      validate: {},
      handler: async (request) => {
        const roleBaseAccess = {
          //students
          specialLogin: ["Tanusree.deb.barma@gmail.com"],
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

          //campus
          campus: {
            view: ["Tanusree.deb.barma@gmail.com", ...commonPermissions],
          },

          //partners
          partners: {
            view: ["Tanusree.deb.barma@gmail.com", ...commonPermissions],
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
        for (var i of campus) {
          roleBaseAccess["campus"][i.name] = {
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
          if (i.name === "Tripura") {
            roleBaseAccess["campus"][i.name].view.push(
              "Tanusree.deb.barma@gmail.com"
            );
          }
        }
        roleBaseAccess["campus"]["All"] = {
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
    method: "GET",
    path: "/rolebaseaccess/email",
    options: {
      description: "emails roles access previleges",
      tags: ["api"],
      validate: {},
      handler: async (request) => {
        const { rolebaseService } = request.services();
        return await rolebaseService.findall();
        return await rolebaseService.addUser({
          email: "kirithiv@navgurukul.org",
          roles: [],
          privilege: [],
        });
      },
    },
  },
  {
    method: "POST",
    path: "/rolebaseaccess/email/add",
    options: {
      description: "emails roles access previleges",
      tags: ["api"],
      validate: {
        payload: {
          email: Joi.string(),
          roles: Joi.array(),
          privilege: Joi.array(),
        },
      },
      handler: async (request) => {
        const { rolebaseService } = request.services();
        return await rolebaseService.addUser(request.payload);
      },
    },
  },
  {
    method: "PUT",
    path: "/rolebaseaccess/email/update/{id}",
    options: {
      description: "emails roles access previleges",
      tags: ["api"],
      validate: {
        params: { id: Joi.number().integer().greater(0) },
        payload: {
          email: Joi.string(),
          roles: Joi.array(),
          privilege: Joi.array(),
        },
      },
      handler: async (request) => {
        const { rolebaseService } = request.services();
        return await rolebaseService.updateUser(
          request.payload,
          request.params.id
        );
      },
    },
  },
  {
    method: "DELETE",
    path: "/rolebaseaccess/email/delete/{id}",
    options: {
      description: "emails roles access previleges",
      tags: ["api"],
      validate: {
        params: { id: Joi.number().integer().greater(0) },
      },
      handler: async (request) => {
        const { rolebaseService } = request.services();
        return await rolebaseService.delete(request.params.id);
      },
    },
  },
];
