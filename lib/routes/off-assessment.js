'use strict';

module.exports = [
    {
        method: 'POST',
        path: '/partners/{partnerId}/assessments',
        description: "Create a new assessment for a partner."
        options: {
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    },
    {
        method: 'GET',
        path: '/partners/{partnerId}/assessments',
        description: "Get all the assessments created for a particular partner."
        options: {
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    },
    {
        method: 'GET',
        path: '/partners/{partnerId}/assessments/{assessmentId}/attempts',
        description: "Get list of all attempts made for a given assessment of a partner."
        options: {
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    },
    {
        method: 'POST',
        path: '/partners/{partnerId}/assessments/{assessmentId}/attempts',
        description: "Create the attempts for a given assessment. Requires a CSV upload."
        options: {
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    }
];
