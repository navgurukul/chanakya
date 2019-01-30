'use strict';

module.exports = [
    {
        method: 'GET',
        path: '/on_assessment/validate_enrolment_key',
        description: "Validates the given enrolment key."
        options: {
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    },
    {
        method: 'POST',
        path: '/on_assessment/details',
        description: "Save the details of student answering the test. Can be used in stages according to frontend."
        options: {
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    },
    {
        method: 'POST',
        path: '/on_assessment/questions/<enrolment_key>',
        description: "Get the questions associated with the given enrolment key. Starts the timer of the alloted time for the test."
        options: {
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    },
    {
        method: 'POST',
        path: '/on_assessment/questions/<enrolment_key>',
        description: "Get the questions associated with the given enrolment key. Saves the start time. No notion of a timer on backend for now."
        options: {
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    },
    {
        method: 'POST',
        path: '/on_assessment/questions/<enrolment_key>',
        description: "Get the questions associated with the given enrolment key. Starts the timer of the alloted time for the test."
        options: {
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    }
];
