'use strict';

module.exports = [
    {
        method: 'GET',
        path: '/flow/register_exotel_call',
        description: "Exotel passthru will ping this endpoint to register a call."
        options: {
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    }
];
