/* All the endpoints related to question buckets & bucket choices are documented here */


const Joi = require('joi');
const Boom = require('boom');

const QuestionBucket = require('../models/questionBucket');
const QuestionBucketChoice = require('../models/questionBucketChoice');

module.exports = [
  {
    method: 'GET',
    path: '/questions/questionBuckets',
    options: {
      description: 'Returns a list of all question buckets',
      tags: ['api'],
      handler: async (request, h) => {
        const { questionBucketService } = request.services();
        const buckets = await questionBucketService.findAll();
        return { data: buckets };
      },
    },
  },
  {
    method: 'POST',
    path: '/questions/questionBuckets',
    options: {
      description: 'Create a new question bucket.',
      tags: ['api'],
      validate: {
        payload: {
          name: QuestionBucket.field('name'),
          numQuestions: QuestionBucket.field('numQuestions'),
        },
      },
      handler: async (request, h) => {
        const { questionBucketService } = request.services();
        const bucket = await questionBucketService.create(request.payload);
        return { data: bucket };
      },
    },
  },
  {
    method: 'POST',
    path: '/questions/questionBuckets/{bucketId}/choices',
    options: {
      description: 'Create a new choice within a bucket of the given `bucketId`',
      tags: ['api'],
      validate: {
        params: {
          bucketId: QuestionBucket.field('id'),
        },
        payload: {
          questionIds: QuestionBucketChoice.field('questionIds'),
        },
      },
      handler: async (request, h) => {
        const { questionBucketService } = request.services();

        const bucket = await questionBucketService.findById(request.params.bucketId);
        const bucketChoice = await questionBucketService.createChoice(bucket, request.payload.questionIds);

        return { data: bucketChoice };
      },
    },
  },
  {
    method: 'GET',
    path: '/questions/questionBuckets/{bucketId}/choices',
    options: {
      description: 'Get a list of all choices associated with the `bucketId`',
      tags: ['api'],
      validate: {
        params: {
          bucketId: QuestionBucket.field('id'),
        },
      },
      handler: async (request, h) => {
        const { questionBucketService } = request.services();

        const bucket = await questionBucketService.findById(request.params.bucketId);

        const choices = await questionBucketService.findChoicesByBucketId(bucket.id);
        return { data: choices };
      },
    },
  },
];
