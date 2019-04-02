'use strict';
const Joi = require('joi');
const Boom = require('boom');
const TestVersion = require('../models/testVersion');


module.exports = [
    {
        method: 'GET',
        path: '/test/versions/current',
        options: {
            description: "Get the current version of the test.",
            tags: ['api'],
            handler: async (request, h) => {
                const { testVersioningService } = request.services();
                let curVersion = await testVersioningService.findCurrent();
                return { data: curVersion };
            }
        }
    },
    {
        method: 'GET',
        path: '/test/versions',
        options: {
            description: "Get all the versions available.",
            tags: ['api'],
            handler: async (request, h) => {
                const { testVersioningService } = request.services();
                let versions = await testVersioningService.findAll();
                return { data: versions };
            }
        }
    },
    {
        method: 'POST',
        path: '/test/versions',
        options: {
            description: "Creates a new version and marks it as the current one.",
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    name: TestVersion.field("name"),
                    questionIds: TestVersion.field("questionIds")
                })
            },
            handler: async (request, h) => {
                //TODO: A check where the question IDs given are checked if they are correct or not.
                const { testVersioningService } = request.services();
                let version = await testVersioningService.createAndMarkAsCurrent(request.payload);
                return { data: version };
            }
        }
    },
    {
        method: 'GET',
        path: '/test/versions/{versionId}/analytics',
        options: {
            description: "Get the question level analytics of the given version.",
            tags: ['api'],
            validate: {
                params: {
                    versionId: TestVersion.field('id')
                }
            },
            handler: async (request, h) => {
                const { testVersioningService } = request.services();

                let version = await testVersioningService.findById(request.params.versionId);
                let report = await testVersioningService.getReportForVersion(version);
                return { data: report };
            }
        }
    },
]
