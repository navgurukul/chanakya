
const Joi = require('joi');
const Boom = require('boom');
const Question = require('../models/question');
const QuestionOption = require('../models/questionOption');

const internals = {};

// Joi schema for question Object
internals.questionSchema = Joi.object({
  commonText: Question.field('commonText'),
  enText: Question.field('enText'),
  hiText: Question.field('hiText'),
  difficulty: Question.field('difficulty'),
  topic: Question.field('topic'),
  type: Question.field('type'),
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
      handler: async (request, h) => {
        const { questionService } = request.services();
        const questions = await questionService.findAll();
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
        options: {
          allowUnknown: true,
        },
        payload: internals.questionSchema.concat(Joi.object({
          options: Joi.array().min(1).items(internals.questionOptionSchema).required(),
        })),
      },
      handler: async (request, h) => {
        const { questionService } = request.services();
        const question = await questionService.create(request.payload);
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
        params: {
          questionId: Question.field('id'),
        },
      },
      handler: async (request, h) => {
        const { questionService } = request.services();
        const question = await questionService.findById(request.params.questionId);
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
        params: {
          questionId: Question.field('id'),
        },
        payload: internals.questionSchema.concat(Joi.object({
          id: Question.field('id'),
          options: Joi.array().items(internals.questionOptionSchema.concat(Joi.object({
            id: QuestionOption.field('id'),
          }))),
        })),
      },
      handler: async (request, h) => {
        const { questionService } = request.services();
        const question = await questionService.update(request.payload);
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
        params: {
          questionId: Question.field('id'),
        },
      },
      handler: async (request, h) => {
        const { questionService } = request.services();
        const response = await questionService.delete(request.params.questionId);
        return { success: true };
      },
    },
  },
];
