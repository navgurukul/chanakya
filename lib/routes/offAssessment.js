'use strict';

module.exports = [
    {
        method: 'POST',
        path: '/partners/{partnerId}/assessments',
        options: {
            description: "Create a new assessment for a partner.",
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    },
    {
        method: 'GET',
        path: '/partners/{partnerId}/assessments',
        options: {
            description: "Get all the assessments created for a particular partner.",
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    },
    {
        method: 'GET',
        path: '/partners/{partnerId}/assessments/{assessmentId}/attempts',
        options: {
            description: "Get list of all attempts made for a given assessment of a partner.",
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    },
    {
        method: 'POST',
        path: '/partners/{partnerId}/assessments/{assessmentId}/attempts',
        options: {
            description: "Create the attempts for a given assessment. Requires a CSV upload.",
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    }
];
