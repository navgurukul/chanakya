const Joi = require('joi');
const Question = require('../models/question');
const QuestionOption = require('../models/questionOption');
const EnrolmentKey = require('../models/enrolmentKey');
const logger = require('../../server/logger');

const internals = {};

// Joi schema for question Object
internals.questionSchema = Joi.object({
  common_text: Question.field('common_text'),
  en_text: Question.field('en_text'),
  hi_text: Question.field('hi_text'),
  ma_text: Question.field('ma_text'),
  difficulty: Question.field('difficulty'),
  topic: Question.field('topic'),
  type: Question.field('type'),
  schoolId: Joi.number().integer().allow(null).optional(),
}).options({ stripUnknown: true });

internals.questionOptionSchema = Joi.object({
  text: QuestionOption.field('text'),
  correct: QuestionOption.field('correct'),
});

module.exports = [
  {
    method: 'GET',
    path: '/questions',
    options: {
      description: 'Return a list of all the questions.',
      tags: ['api'],
      handler: async (request) => {
        const { questionService } = request.services();
        const questions = await questionService.findAll();
        logger.info('Return a list of all the questions.');
        return { data: questions };
      },
    },
  },
  {
    method: 'POST',
    path: '/questions',
    options: {
      description: 'Create a new question.',
      tags: ['api'],
      validate: {
        options: Joi.object({
          allowUnknown: true,
        }),
        payload: internals.questionSchema.concat(
          Joi.object({
            options: Joi.array().min(1).items(internals.questionOptionSchema).required(),
          })
        ),
      },
      handler: async (request) => {
        const { questionService } = request.services();
        // const question = await Promise.all(request.payload.map(question => questionService.create(question)));
        const question = await questionService.create(request.payload);
        // const question = await questionService.create(request.payload);
        logger.info('Create a new question.');
        return { data: question };
      },
    },
  },
  {
    method: 'GET',
    path: '/questions/{questionId}',
    options: {
      description: 'Get details of the question with the given ID.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          questionId: Question.field('id'),
        }),
      },
      handler: async (request) => {
        const { questionService } = request.services();
        const question = await questionService.findById(request.params.questionId);
        logger.info('Get details of the question with the given ID.');
        return { data: question };
      },
    },
  },
  {
    method: 'PUT',
    path: '/questions/{questionId}',
    options: {
      description: 'Edit the question with a given ID.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          questionId: Question.field('id'),
        }),
        payload: Joi.object({
          common_text: Question.field('common_text'),
          en_text: Question.field('en_text'),
          hi_text: Question.field('hi_text'),
          ma_text: Question.field('ma_text'),
          difficulty: Question.field('difficulty'),
          topic: Question.field('topic'),
          type: Question.field('type'),
          id: Question.field('id'),
          options: Joi.array(),
        }).options({ stripUnknown: true }),
      },
      handler: async (request) => {
        const { questionService } = request.services();
        const question = await questionService.update(request.payload);
        logger.info('Edit the question with a given ID.');
        return { data: question };
      },
    },
  },
  {
    method: 'DELETE',
    path: '/questions/{questionId}',
    options: {
      description: 'Delete the question with a given ID.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          questionId: Question.field('id'),
        }),
      },
      handler: async (request) => {
        const { questionService } = request.services();
        await questionService.delete(request.params.questionId); // responce
        logger.info('Delete the question with a given ID.');
        return { success: true };
      },
    },
  },

  {
    method: 'GET',
    path: '/questions/attempts/{enrolmentKeyId}',
    options: {
      description: 'Get the questions by a given enrolmentKeyId.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          enrolmentKeyId: EnrolmentKey.field('id'),
        }),
      },
      handler: async (request) => {
        const { questionAttemptService } = request.services();
        const attempts = await questionAttemptService.findQuestionIdByEnrolmentKeyId(
          request.params.enrolmentKeyId
        );
        logger.info('Get the questions by a given enrolmentKeyId.');
        return attempts;
      },
    },
  },
];
