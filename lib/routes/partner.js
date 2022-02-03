const Joi = require("joi");
const Partner = require("../models/partner");
const { getRouteScope } = require("./helpers");

const internals = {};
internals.partnerSchema = Joi.object({
  name: Partner.field("name").required(),
  notes: Partner.field("notes"),
  slug: Partner.field("slug").required(),
  email: Partner.field("email"),
  partner_user: Joi.array(), 
  districts: Partner.field("districts"),
  state: Partner.field("state"),
  meraki_link: Partner.field("meraki_link"),
});

module.exports = [
  {
    method: "GET",
    path: "/partners",
    options: {
      description: "List of all partners in the system.",
      tags: ["api"],
      // auth: {
      //   strategy: 'jwt',
      //   scope: ['admin'],
      // },
      handler: async (request) => {
        const { partnerService } = request.services();
        const partners = await partnerService.findAll();
        return { data: partners };
      },
    },
  },
  {
    method: "POST",
    path: "/partners",
    options: {
      description: "Create a new partner.",
      tags: ["api"],
      auth: {
        strategy: "jwt",
        scope: getRouteScope("partner"),
      },
      validate: {
        payload: internals.partnerSchema,
      },
      handler: async (request) => {
        const { partnerService } = request.services();
        const partnerDetails = { ...request.payload };
        if (request.auth.isAuthenticated) {
          partnerDetails.referred_by = request.auth.credentials.email;
        }
         const partnerUser = partnerDetails["partner_user"];
        
        delete partnerDetails["partner_user"];
        const partner = await partnerService.create(partnerDetails);
         await partnerService.insertPartnerUser(partner.id,partnerUser);
        return { data: partner };
      },
    },
  },
  {
    method: "PUT",
    path: "/partners/{partnerId}/merakiLink",
    options: {
      description: "Get partner details with the given ID.",
      tags: ["api"],
      auth: {
        strategy: "jwt",
        scope: getRouteScope("partner"),
      },
      validate: {
        params: {
          partnerId: Partner.field("id"),
        },
        headers: Joi.object({
          platform: Joi.string().valid("web", "android"),
        }),
        options: { allowUnknown: true },
      },
      handler: async (request) => {
        const { partnerService } = request.services();
        const { partnerId } = request.params;
        if (request.auth.credentials.scope.indexOf("admin") < 0) {
          if (partnerId !== request.auth.credentials.partner_id) {
            return {
              error: true,
              message:
                "Access Denied. Please contact meraki@navgurukul.org if you think this is an error.",
            };
          }
        }
        const partner = await partnerService.partnerSpecificLink(
          request.headers.platform,
          request.params.partnerId
        );
        return { data: partner };
      },
    },
  },
  {
    method: "GET",
    path: "/partners/{partnerId}",
    options: {
      description: "Get partner details with the given ID.",
      tags: ["api"],
      // auth: {
      //   strategy: "jwt",
      //   scope: getRouteScope("partner"),
      // },
      validate: {
        params: {
          partnerId: Partner.field("id"),
        },
      },
      handler: async (request) => {
        // const { partnerId } = request.params;
        const { partnerService } = request.services();
        // if (request.auth.credentials.scope.indexOf("admin") < 0) {
        //   if (partnerId !== request.auth.credentials.partner_id) {
        //     return {
        //       error: true,
        //       message:
        //         "Access Denied. Please contact meraki@navgurukul.org if you think this is an error.",
        //     };
        //   }
        // }
        const partner = await partnerService.findById(request.params.partnerId);
        return { data: partner };
      },
    },
  },
  {
    method: "PUT",
    path: "/partners/{partnerId}",
    options: {
      description: "Edit partner details with the given ID.",
      tags: ["api"],
      // auth: {
      //   strategy: "jwt",
      //   scope: getRouteScope("partner"),
      // },
      validate: {
        params: {
          partnerId: Partner.field("id"),
        },
        payload: Joi.object({
          name: Partner.field("name"),
          notes: Partner.field("notes"),
          slug: Partner.field("slug"),
          email: Partner.field("email"),
          partner_user: Joi.array(), 
          districts: Partner.field("districts"),
          state: Partner.field("state"),
          meraki_link: Partner.field("meraki_link"),
        }),
      },
      handler: async (request) => {
        const { partnerService } = request.services();
        // const { partnerId } = request.params;
        // if (request.auth.credentials.scope.indexOf("admin") < 0) {
        //   if (partnerId !== request.auth.credentials.partner_id) {
        //     return {
        //       error: true,
        //       message:
        //         "Access Denied. Please contact meraki@navgurukul.org if you think this is an error.",
        //     };
        //   }
        // }
        const partner = await partnerService.findById(request.params.partnerId);
        const partnerDetails = { ...request.payload };
        
        const partnerUser = partnerDetails["partner_user"];
        await partnerService.updatePartnerUser(partnerUser)
        delete partnerDetails["partner_user"];


        await partnerService.update(request.params.partnerId, {
          ...partner,
         ...partnerDetails,
        });

        return { data: partner };
      },
    },
  },
  {
    method: "GET",
    path: "/partners/{partnerId}/students",
    options: {
      description: "Get all the students of a given partner",
      tags: ["api"],
      // auth: {
      //   strategy: "jwt",
      //   scope: getRouteScope("partner"),
      // },
      validate: {
        params: {
          partnerId: Partner.field("id"),
        },
        query: {
          from: Joi.date(),
          to: Joi.date(),
        },
      },
      handler: async (request) => {
        const { studentService, partnerService } = request.services();
        // const { partnerId } = request.params;
        // if (request.auth.credentials.scope.indexOf("admin") < 0) {
        //   if (partnerId !== request.auth.credentials.partner_id) {
        //     return {
        //       error: true,
        //       message:
        //         "Access Denied. Please contact meraki@navgurukul.org if you think this is an error.",
        //     };
        //   }
        // }
        const fromDate = request.query.from;
        const toDate = request.query.to;

        const partner = await partnerService.findById(request.params.partnerId);
        const students = await studentService.findAllByPartner(
          partner.id,
          fromDate,
          toDate
        );

        return { data: students };
      },
    },
  },
  {
    method: "GET",
    path: "/partners/{partnerId}/students/distribution",
    options: {
      description: "Get all the students of a given partner graph distribution",
      tags: ["api"],
      // auth: {
      //   strategy: "jwt",
      //   scope: getRouteScope("partner"),
      // },
      validate: {
        params: {
          partnerId: Partner.field("id"),
        },
        query: {
          from: Joi.date(),
          to: Joi.date(),
        },
      },
      handler: async (request) => {
        const { partnerId } = request.params;
        const { studentService, partnerService, graphService } =
          request.services();
        const fromDate = request.query.from;
        const toDate = request.query.to;
        // if (request.auth.credentials.scope.indexOf("admin") < 0) {
        //   if (partnerId !== request.auth.credentials.partner_id) {
        //     return {
        //       error: true,
        //       message:
        //         "Access Denied. Please contact meraki@navgurukul.org if you think this is an error.",
        //     };
        //   }
        // }
        const partner = await partnerService.findById(request.params.partnerId);
        const s = await studentService.addStudentDetails(
          await studentService.findAllByPartner(partner.id, fromDate, toDate)
        );
        console.log(s);
        const students = await graphService.graph(s);
        return { data: students };
      },
    },
  },
  {
    method: "GET",
    path: "/partners/slug/{slug}",
    options: {
      description: "Get partners details by slug",
      tags: ["api"],
      validate: {
        params: {
          slug: Joi.string().required(),
        },
      },
      handler: async (request) => {
        const { partnerService } = request.services();

        const [partner] = await partnerService.findBySlug(request.params.slug);
        return { data: partner };
      },
    },
  },
  {
    method: "GET",
    path: "/partners/studentId/{studentId}",
    options: {
      description: "Get partners details by slug",
      tags: ["api"],
      // auth: {
      //   strategy: "jwt",
      //   scope: getRouteScope("partner"),
      // },
      validate: {
        params: {
          studentId: Joi.string().required(),
        },
      },
      handler: async (request) => {
        const { partnerService } = request.services();

        const partner = await partnerService.findByStudentId(
          request.params.studentId
        );
        return { data: partner };
      },
    },
  },
  {
    method: "GET",
    path: "/partners/enrolmentKey/{enrolmentKey}",
    options: {
      description: "Get partners details by enrolment key of student",
      tags: ["api"],
      // auth: {
      //   strategy: "jwt",
      //   scope: getRouteScope("partner"),
      // },
      validate: {
        params: {
          enrolmentKey: Joi.string().required(),
        },
      },
      handler: async (request) => {
        const { partnerService } = request.services();

        const [partner] = await partnerService.findByEnrolmentKey(
          request.params.enrolmentKey
        );
        return { data: partner };
      },
    },
  },
  {
    method: "GET",
    path: "/partners/progress_made/{partnerId}",
    options: {
      description: "Get all partner students details for progress made.",
      tags: ["api"],
      // auth: {
      //   strategy: "jwt",
      //   scope: getRouteScope("partner"),
      // },
      validate: {
        params: {
          partnerId: Partner.field("id"),
        },
      },
      handler: async (request) => {
        const { partnerService } = request.services();
        // const { partnerId } = request.params;
        // if (request.auth.credentials.scope.indexOf("admin") < 0) {
        //   if (partnerId !== request.auth.credentials.partner_id) {
        //     return {
        //       error: true,
        //       message:
        //         "Access Denied. Please contact meraki@navgurukul.org if you think this is an error.",
        //     };
        //   }
        // }
        const partner = await partnerService.progressMade(
          request.params.partnerId
        );
        return { data: partner };
      },
    },
  },
  {
    method: "GET",
    path: "/partners/joined_progress_made/{partnerId}",
    options: {
      description:
        "Get all partner students details who joined campus for progress made.",
      tags: ["api"],
      // auth: {
      //   strategy: "jwt",
      //   scope: getRouteScope("partner"),
      // },
      validate: {
        params: {
          partnerId: Partner.field("id"),
        },
      },
      handler: async (request) => {
        const { partnerService } = request.services();
        // const { partnerId } = request.params;
        // if (request.auth.credentials.scope.indexOf("admin") < 0) {
        //   if (partnerId !== request.auth.credentials.partner_id) {
        //     return {
        //       error: true,
        //       message:
        //         "Access Denied. Please contact meraki@navgurukul.org if you think this is an error.",
        //     };
        //   }
        // }
        const partner = await partnerService.student_progressMade(
          request.params.partnerId
        );
        return { data: partner };
      },
    },
  },
  {
    method: "GET",
    path: "/partners/{partnerId}/students/progress_made_card",
    options: {
      description: "Get all partner students details for progress made card.",
      tags: ["api"],
      // auth: {
      //   strategy: "jwt",
      //   scope: getRouteScope("partner"),
      // },
      validate: {
        params: {
          partnerId: Partner.field("id"),
        },
      },
      handler: async (request) => {
        const { partnerService, studentProgressService } = request.services();
        // const { partnerId } = request.params;
        // if (request.auth.credentials.scope.indexOf("admin") < 0) {
        //   if (partnerId !== request.auth.credentials.partner_id) {
        //     return {
        //       error: true,
        //       message:
        //         "Access Denied. Please contact meraki@navgurukul.org if you think this is an error.",
        //     };
        //   }
        // }
        const partner = await studentProgressService.student_progressMade_Cards(
          await partnerService.student_progressMade(request.params.partnerId)
        );
        return { data: partner };
      },
    },
  },
];
