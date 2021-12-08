const CONSTANTS = require("../constants");
const Joi = require("joi");

module.exports = [
  {
    method: "GET",
    path: "/donor/{donerId}/students",
    options: {
      description: "Get all donor students details for progress made.",
      tags: ["api"],
      validate: {
        params: {
          donerId: Joi.string(),
        },
      },
      handler: async (request) => {
        const { donorService } = request.services();

        const students = await donorService.progressMade(
          request.params.donerId
        );
        return { data: students };
      },
    },
  },
  {
    method: "GET",
    path: "/donor/{donerId}/students/distribution",
    options: {
      description:
        "Get all donor students details for progress made graph distribution.",
      tags: ["api"],
      validate: {
        params: {
          donerId: Joi.string(),
        },
      },
      handler: async (request) => {
        const { graphService, donorService } = request.services();
        const students = await graphService.graph(
          await donorService.progressMade(request.params.donerId)
        );
        return { data: students };
      },
    },
  },
  {
    method: "GET",
    path: "/donors",
    options: {
      description: "List of all donors in the system.",
      tags: ["api"],
      handler: async (request) => {
        const { donorService } = request.services();
        return await donorService.findall();
      },
    },
  },
  {
    method: "GET",
    path: "/donor/{donerId}/students/progress_made_card",
    options: {
      description: "Get all donor students details for progress made card.",
      tags: ["api"],
      validate: {
        params: {
          donerId: Joi.string(),
        },
      },
      handler: async (request) => {
        const { donorService, studentProgressService } = request.services();

        const students =
          await studentProgressService.student_progressMade_Cards(
            await donorService.progressMade(request.params.donerId)
          );
        return { data: students };
      },
    },
  },
];
