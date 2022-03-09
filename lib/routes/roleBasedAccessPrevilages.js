const { permissions, campus, superAdmin } = require("../config");
const Joi = require("joi");
const specialLogin = ["Tanusree.deb.barma@gmail.com"];
const adminView = ["vaibhavmagar@navgurukul.org"];
const adminUpdate = ["vaibhavmagar@navgurukul.org"];
const commonPermissions = [
  ...permissions.updateStage,
  ...permissions.addOrUpdateContact,
  ...permissions.updateStudentName,
  ...superAdmin,
];
const studentView = [...commonPermissions];
const campusView = ["Tanusree.deb.barma@gmail.com", ...commonPermissions];
const partnersView = ["Tanusree.deb.barma@gmail.com", ...commonPermissions];
// console.log(permissions)
const uniqueEmails = () => {
  const data = {};
  const dataList = [
    ...commonPermissions,
    ...studentView,
    ...campusView,
    ...partnersView,
  ];
  dataList.map((e) => {
    data[e] = "";
  });
  return Object.keys(data);
};
const roleBaseAccessFunction = () => {
  const roleBaseAccess = {
    //students
    admin: {
      view: [...adminView],
      update: [...adminUpdate],
    },
    specialLogin: [...specialLogin],
    students: {
      view: [...studentView],
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
      view: [...campusView],
    },

    //partners
    partners: {
      view: [...partnersView],
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
      view: [...commonPermissions],
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
    view: [...commonPermissions],
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
};
var roleBaseAccess = roleBaseAccessFunction();

module.exports = [
  {
    method: "POST",
    path: "/rolebaseaccess/assign",
    options: {
      description: "special login",
      tags: ["api"],
      validate: {
        payload: {
          email: Joi.string().required(),
          privilege: Joi.array()
            .allow([
              "specialLogin",
              "adminView",
              "adminUpdate",
              "studentView",
              "campusView",
              "partnersView",
            ])
            .required(),
        },
      },
      handler: async (request) => {
        const { email } = request.payload;
        if (request.payload.privilege.includes("specialLogin")) {
          if (!specialLogin.includes(email)) {
            specialLogin.push(email);
          }
        }
        if (request.payload.privilege.includes("adminView")) {
          if (!adminView.includes(email)) {
            adminView.push(email);
          }
        }

        if (request.payload.privilege.includes("adminUpdate")) {
          if (!adminUpdate.includes(email)) {
            adminUpdate.push(email);
          }
        }
        if (request.payload.privilege.includes("studentView")) {
          if (!studentView.includes(email)) {
            studentView.push(email);
          }
        }
        if (request.payload.privilege.includes("campusView")) {
          if (!campusView.includes(email)) {
            campusView.push(email);
          }
        }
        if (request.payload.privilege.includes("partnersView")) {
          if (!partnersView.includes(email)) {
            partnersView.push(email);
          }
        }
        roleBaseAccess = roleBaseAccessFunction();
        return {
          data: "success fully updated",
        };
      },
    },
  },
  {
    method: "GET",
    path: "/rolebaseaccess",
    options: {
      description: "access previleges",
      tags: ["api"],
      validate: {},
      handler: async (request) => {
        return roleBaseAccess;
      },
    },
  },
];
