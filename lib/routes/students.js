'use strict';

module.exports = [
    {
        method: 'GET',
        path: '/students/{studentId}/request_callback',
        description: "The student with the given ID needs to be called back."
        options: {
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    },
    {
        method: 'GET',
        path: '/students/{studentId}/send_enrolment_key',
        description: "Sends the enrolment key to students. Creates one if doesn't exist."
        options: {
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    },
];
