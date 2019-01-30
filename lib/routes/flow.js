'use strict';

module.exports = [
    {
        method: 'GET',
        path: '/general/register_exotel_call',
        options: {
            description: "Exotel passthru will ping this endpoint to register a call.",
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    },
    {
        method: 'POST',
        path: '/general/upload_file/{uploadType}',
        options: {
            description: "Upload file to S3. Upload type like assessment CSV or question images need to be specified.",
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    }
];
