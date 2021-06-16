const Joi = require("joi");
const moment = require("moment");
const _ = require("underscore");

const commonConnfig = require("../config");

module.exports = [
  {
    method: "GET",
    path: "/reports/stageTransitions",
    options: {
      description:
        "Get the time between stage transitions from x to y stage between the given time window",
      tags: ["api"],
      validate: {
        query: {
          startDate: Joi.date().required(),
          endDate: Joi.date().required(),
          from_stage: Joi.string()
            .required()
            .valid(_.keys(commonConnfig.allStages)),
          to_stage: Joi.string()
            .required()
            .valid(_.keys(commonConnfig.allStages)),
        },
      },
      handler: async (request) => {
        const { metricsService } = request.services();

        // process start and end dates
        const startDate = moment(request.query.startDate, "YYYY-MM-DD");
        const endDate = moment(request.query.endDate, "YYYY-MM-DD");

        // pick the from & to stage
        const { from_stage, to_stage } = request.query;

        const transitions = await metricsService.getStageTransitionMetrics(
          from_stage,
          to_stage,
          startDate,
          endDate
        );

        return transitions;
      },
    },
  },
];
