const Joi = require('joi');
const moment = require('moment');
const _ = require('underscore');

const commonConnfig = require('../config');
const logger = require('../../server/logger');

module.exports = [
  {
    method: 'GET',
    path: '/reports/stageTransitions',
    options: {
      description:
        'Get the time between stage transitions from x to y stage between the given time window',
      tags: ['api'],
      validate: {
        query: Joi.object({
          startDate: Joi.date().required(),
          endDate: Joi.date().required(),
          formStage: Joi.string()
            .required()
            .valid(..._.keys(commonConnfig.allStages)),
          toStage: Joi.string()
            .required()
            .valid(..._.keys(commonConnfig.allStages)),
        }),
      },
      handler: async (request) => {
        const { metricsService } = request.services();

        // process start and end dates
        const startDate = moment(request.query.startDate, 'YYYY-MM-DD');
        const endDate = moment(request.query.endDate, 'YYYY-MM-DD');

        // pick the from & to stage
        const { fromStage, toStage } = request.query;

        const transitions = await metricsService.getStageTransitionMetrics(
          fromStage,
          toStage,
          startDate,
          endDate
        );
        logger.info(
          'Get the time between stage transitions from x to y stage between the given time window'
        );
        return transitions;
      },
    },
  },
];
