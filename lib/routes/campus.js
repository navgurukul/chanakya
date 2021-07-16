const CONSTANTS = require("../constants");
const Joi = require("joi");
module.exports = [
  {
    method: "GET",
    path: "/campus/{campusId}/students/distribution",
    options: {
      description: "Get all students details for progress made graph.",
      tags: ["api"],
      validate: {
        params: {
          campusId: Joi.number().integer(),
        },
      },
      handler: async (request) => {
        const { graphService, studentCampusService } = request.services();

        const students = await graphService.graph(
          await studentCampusService.progressMade(request.params.campusId)
        );
        return { data: students };
      },
    },
  },
  {
    method: "GET",
    path: "/campus/{campusId}/students",
    options: {
      description: "Get all students details for progress made.",
      tags: ["api"],
      validate: {
        params: {
          campusId: Joi.number().integer(),
        },
      },
      handler: async (request) => {
        const { studentCampusService } = request.services();

        const students = await studentCampusService.progressMade(
          request.params.campusId
        );
        return { data: students };
      },
    },
  },
  {
    method: "GET",
    path: "/campus",
    options: {
      description: "List of all campus in the system.",
      tags: ["api"],
      handler: async (request) => {
        const { campusService } = request.services();
        return { data: await campusService.findall() };
      },
    },
  },
  {
    method: "GET",
    path: "/campus/{campusId}/students/progress_made_card",
    options: {
      description: "Get all students details for progress made card.",
      tags: ["api"],
      validate: {
        params: {
          campusId: Joi.number().integer(),
        },
      },
      handler: async (request) => {
        const { studentCampusService, studentProgressService } =
          request.services();

        const students =
          await studentProgressService.student_progressMade_Cards(
            await studentCampusService.progressMade(request.params.campusId)
          );
        return { data: students };
      },
    },
  },
];
