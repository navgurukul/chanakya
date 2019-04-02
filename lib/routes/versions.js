'use strict';
const Joi = require('joi');
const TestVersion = require('../models/testVersion');


module.exports = [
    {
        method: 'GET',
        path: '/test/versions/current',
        options: {
            description: "Get the current version of the test.",
            tags: ['api'],
            handler: async (request, h) => {
                const { assessmentService } = request.services();
                let curVersion = await assessmentService.findCurrentTestVersion();
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
                const { assessmentService } = request.services();
                let versions = await assessmentService.findAllTestVersions();
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
                const { assessmentService } = request.services();
                let version = await assessmentService.createNewTestVersionAndMarkCurrent(request.payload);
                return { data: version };
            }
        }
    }
]
