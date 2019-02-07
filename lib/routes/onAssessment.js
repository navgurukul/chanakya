'use strict';

module.exports = [
    {
        method: 'GET',
        path: '/on_assessment/validate_enrolment_key',
        options: {
            description: "Validates the given enrolment key.",
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    },
    {
        method: 'POST',
        path: '/on_assessment/details',
        options: {
            description: "Save the details of student answering the test. Can be used in stages according to frontend.",
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    },
    {
        method: 'POST',
        path: '/on_assessment/questions/{enrolmentKey}',
        options: {
            description: "Get the questions associated with the given enrolment key. Starts the timer of the alloted time for the test.",
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    },
    {
        method: 'POST',
        path: '/on_assessment/questions/{enrolmentKey}/answers',
        options: {
            description: "Saves the answers given by the student. Saves the end time of the test.",
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    }
];
