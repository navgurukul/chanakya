const Joi = require("joi");
const Boom = require("boom");
const Student = require("../models/student");
const EnrolmentKey = require("../models/enrolmentKey");
const Contact = require("../models/studentContact");
const CONSTANTS = require("../constants");

module.exports = [
  {
    method: "GET",
    path: "/students/{studentId}/request_callback",
    options: {
      description: "The student with the given ID needs to be called back.",
      tags: ["api"],
      handler: async () => ({ notImplemented: true }),
    },
  },
  {
    method: "GET",
    path: "/students/{studentId}/send_enrolment_key",
    options: {
      description:
        "Sends the enrolment key to students. Creates one if doesn't exist.",
      tags: ["api"],
      handler: async () => ({ notImplemented: true }),
    },
  },
  {
    method: "GET",
    path: "/students/status/{mobile}",
    options: {
      description: "Get students status using existing users mobile number",
      tags: ["api"],
      validate: {
        params: {
          mobile: Joi.string().length(10).required(),
        },
      },
      handler: async (request) => {
        const { studentService } = request.services();
        const studentStatus = await studentService.studentStatus(
          request.params.mobile
        );
        if (studentStatus.length) {
          return { data: studentStatus };
        }
        throw Boom.badRequest(
          "The Mobile number specified is wrong. Please check and try again."
        );
      },
    },
  },
  {
    method: "GET",
    path: "/students",
    options: {
      description:
        "get the students requestCallback data and softwareCourseData.",
      tags: ["api"],
      validate: {
        options: {
          allowUnknown: true,
        },
        query: {
          dataType: Joi.string(),
          stage: Joi.string(),
          from: Joi.date(),
          to: Joi.date(),
        },
      },
      handler: async (request) => {
        const { studentService } = request.services();
        const fromDate = request.query.from;
        const toDate = request.query.to;
        const data = await studentService.studentsDataForDashBoard(
          request.query.dataType,
          fromDate,
          toDate,
          request.query.stage
        );
        if (
          !fromDate &&
          !toDate &&
          data.length <= CONSTANTS.allStudentListSize
        ) {
          return { data: data.reverse() };
        }

        if (data.length <= CONSTANTS.allStudentListSize) {
          return { data: data.reverse() };
        }
        return {
          data: data
            .slice(data.length - CONSTANTS.allStudentListSize, data.length)
            .reverse(),
          message: `Number of rows are more than ${CONSTANTS.allStudentListSize}`,
        };
      },
    },
  },
  {
    method: "POST",
    path: "/students/chnageStage/{studentId}",
    options: {
      description: "Change student stage by studentId",
      tags: ["api"],
      validate: {
        params: {
          studentId: Joi.number().integer().required(),
        },
        payload: {
          stage: Joi.string().valid(CONSTANTS.studentStages).required(),
        },
      },
      handler: async (request) => {
        const { studentService, assessmentService } = request.services();
        const studentStatus = await studentService.getStudentById(
          request.params.studentId
        );
        const [student] = studentStatus;
        const changedStage = await assessmentService.patchStudentDetails(
          { student_id: request.params.studentId, student },
          request.payload
        );
        if (changedStage) {
          return { data: "Successfully changed stage" };
        }
        throw Boom.badRequest(
          "The Mobile number specified is wrong. Please check and try again."
        );
      },
    },
  },
  {
    method: "GET",
    path: "/students/transitions/{studentId}",
    options: {
      description: "get transition data by studentId",
      tags: ["api"],
      validate: {
        params: {
          studentId: Joi.number().integer().required(),
        },
      },
      handler: async (request) => {
        const { studentService } = request.services();
        const studentTransitions = await studentService.getTransitionData(
          request.params.studentId
        );
        if (studentTransitions) {
          return { data: studentTransitions };
        }
        throw Boom.badRequest(
          "The studentId specified is wrong. Please checks and try again."
        );
      },
    },
  },
  {
    method: "GET",
    path: "/students/report/dangling",
    options: {
      description:
        "get dangling students record distribution on basis of student stage and gender",
      tags: ["api"],
      handler: async (request) => {
        const { studentService } = request.services();
        const record = await studentService.stageWiseDanglingReport();
        return { data: record };
      },
    },
  },
  {
    method: "GET",
    path: "/students/report/all",
    options: {
      description:
        "get all students record distribution on basis of student stage and gender",
      tags: ["api"],
      handler: async (request) => {
        const { studentService } = request.services();
        const record = await studentService.stageWiseGenderDistribution();
        return { data: record };
      },
    },
  },
  {
    method: "POST",
    path: "/students/percentile/{enrolmentKey}",
    options: {
      description: "The student with the given ID needs to be called back.",
      tags: ["api"],
      validate: {
        params: {
          enrolmentKey: EnrolmentKey.field("key"),
        },
        payload: {
          state: Student.field("state"),
        },
      },
      handler: async (request) => {
        const { studentService } = request.services();
        const percentile = await studentService.getStudentsPercentile(
          request.params.enrolmentKey,
          request.payload
        );
        return {
          data: percentile,
        };
      },
    },
  },
  {
    method: "POST",
    path: "/students/tag/{studentId}",
    options: {
      description: "Add tag for online classes by studentId",
      tags: ["api"],
      validate: {
        params: {
          studentId: Joi.number().integer().required(),
        },
        payload: {
          tag: Joi.string(),
        },
      },
      handler: async (request) => {
        const { studentService } = request.services();
        const studentStatus = await studentService.addTagForOnlineClasses(
          request.params.studentId,
          request.payload.tag
        );
        if (studentStatus) {
          return { data: studentStatus };
        }
        throw Boom.badRequest(
          "The specified studentId is wrong. Please check and try again."
        );
      },
    },
  },
  {
    method: "POST",
    path: "/students/contactUpdateAdd/{studentId}",
    options: {
      description: "Add tag for online classes by studentId",
      tags: ["api"],
      validate: {
        params: {
          studentId: Joi.number().integer().required(),
        },
        payload: {
          mobile: Contact.field("mobile"),
          contact_type: Contact.field("contact_type"),
          updateOrAddType: Joi.string()
            .valid(...CONSTANTS.contactAddOrUpdateType)
            .required(),
        },
      },
      handler: async (request) => {
        const { studentService } = request.services();
        const studentStatus = await studentService.addAndUpdateContact(
          request.payload,
          request.params.studentId
        );
        if (studentStatus) {
          return { data: studentStatus };
        }
        throw Boom.badRequest(
          "The specified studentId is wrong. Please check and try again."
        );
      },
    },
  },
  {
    method: "GET",
    path: "/students/{studentId}",
    options: {
      description: "get student detail by Id.",
      tags: ["api"],
      validate: {
        params: {
          studentId: Joi.number().integer().required(),
        },
      },
      handler: async (request) => {
        const { studentService } = request.services();
        const studentDetail = await studentService.getStudentById(
          request.params.studentId
        );
        return { data: studentDetail };
      },
    },
  },
];
