/* All the endpoints related to question buckets & bucket choices are documented here */

// const Joi = require('joi');
// const Boom = require('boom');

const QuestionBucket = require('../models/questionBucket');
const QuestionBucketChoice = require('../models/questionBucketChoice');

module.exports = [
  {
    method: 'GET',
    path: '/questions/questionBuckets',
    options: {
      description: 'Returns a list of all question buckets',
      tags: ['api'],
      handler: async (request) => {
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
          num_questions: QuestionBucket.field('num_questions'),
        },
      },
      handler: async (request) => {
        const { questionBucketService } = request.services();
        const bucket = await questionBucketService.create(request.payload);
        return { data: bucket };
      },
    },
  },
  {
    method: 'POST',
    path: '/questions/questionBuckets/{bucket_id}/choices',
    options: {
      description: 'Create a new choice within a bucket of the given `bucket_id`',
      tags: ['api'],
      validate: {
        params: {
          bucket_id: QuestionBucket.field('id'),
        },
        payload: {
          question_ids: QuestionBucketChoice.field('question_ids'),
        },
      },
      handler: async (request) => {
        const { questionBucketService } = request.services();

        const bucket = await questionBucketService.findById(request.params.bucket_id);
        const bucketChoice = await questionBucketService
          .createChoice(bucket, request.payload.question_ids);

        return { data: bucketChoice };
      },
    },
  },
  {
    method: 'GET',
    path: '/questions/questionBuckets/{bucket_id}/choices',
    options: {
      description: 'Get a list of all choices associated with the `bucket_id`',
      tags: ['api'],
      validate: {
        params: {
          bucket_id: QuestionBucket.field('id'),
        },
      },
      handler: async (request) => {
        const { questionBucketService } = request.services();

        const bucket = await questionBucketService.findById(request.params.bucket_id);

        const choices = await questionBucketService.findChoicesBybucket_id(bucket.id);
        return { data: choices };
      },
    },
  },
];
