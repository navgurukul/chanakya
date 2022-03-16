const _ = require('underscore');
const Joi = require('joi');
const Boom = require('boom');

const TestVersion = require('../models/testVersion');

module.exports = [
  {
    method: 'GET',
    path: '/test/versions/current',
    options: {
      description: 'Get the current version of the test.',
      tags: ['api'],
      handler: async (request) => {
        const { testVersioningService } = request.services();
        const curVersion = await testVersioningService.findCurrent();
        return { data: curVersion };
      },
    },
  },
  {
    method: 'GET',
    path: '/test/versions',
    options: {
      description: 'Get all the versions available.',
      tags: ['api'],
      handler: async (request) => {
        const { testVersioningService } = request.services();
        const versions = await testVersioningService.findAll();
        return { data: versions };
      },
    },
  },
  {
    method: 'POST',
    path: '/test/versions',
    options: {
      description: 'Creates a new version and marks it as the current one.',
      tags: ['api'],
      validate: {
        payload: Joi.object({
          name: TestVersion.field('name'),
          questionIds: Joi.array()
            .items(Joi.number().integer().greater(0))
            .required(),
          buckets: Joi.array().items(
            Joi.object({
              bucketId: Joi.number().integer().greater(0).required(),
              choiceIds: Joi.array()
                .items(Joi.number().integer().greater(0))
                .required(),
            })
          ),
        }),
      },
      handler: async (request) => {
        const { buckets } = request.payload;

        // check if the buckets array has unique bucket IDs
        const bucketIds = _.map(buckets, (b) => b.bucket_id);
        if (bucketIds.length !== buckets.length) {
          throw Boom.badRequest(
            'Buckets array should only have unique `bucket_ids`'
          );
        }

        // pass the data to the testing service to create a version
        const { testVersioningService } = request.services();
        const version = await testVersioningService.createAndMarkAsCurrent(
          request.payload.name,
          request.payload.questionIds,
          buckets
        );
        return { data: version };
      },
    },
  },
  {
    method: 'GET',
    path: '/test/versions/{versionId}/analytics',
    options: {
      description: 'Get the question level analytics of the given version.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          versionId: TestVersion.field('id'),
        }),
      },
      // const { testVersioningService } = request.services();
      // Becuse the versioning logic has changed and the associated
      // question IDs are no more stored in an array. Anyway we are using
      // ReDash for our dashboard needs.
      // const version = await testVersioningService.findById(request.params.versionId);
      // const report = await testVersioningService.getReportForVersion(version);
      // return { data: report };
      handler: async () => ({ notImplemented: true }),
    },
  },
];
