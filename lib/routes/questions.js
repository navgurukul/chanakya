'use strict';

module.exports = [
    {
        method: 'POST',
        path: '/questions/upload_image',
        description: "Upload an image which can be used in the question body. Returns an S3 Link."
        options: {
            tags: ['api'],
            handler: async (request, h) => {
                return {'url': "http://google.com/"}
            }
        }
    },
    {
        method: 'GET',
        path: '/questions',
        description: "Return a list of all the questions."
        options: {
            tags: ['api'],
            handler: async (request, h) => {
                return {'data': [
                    {'id': 1},
                    {'id': 2}
                ]}
            }
        }
    },
    {
        method: 'POST',
        path: '/questions',
        description: "Create a new question."
        options: {
            tags: ['api'],
            handler: async (request, h) => {
                return {'data': {
                    'id': 20
                }}
            }
        }
    },
    {
        method: 'GET',
        path: '/questions/{questionId}',
        description: "Get details of the question with the given ID."
        options: {
            tags: ['api'],
            handler: async (request, h) => {
                return {'data': {
                    'id': 20
                }}
            }
        }
    },
    {
        method: 'PUT',
        path: '/questions/{questionId}',
        description: "Edit the question with a given ID."
        options: {
            tags: ['api'],
            handler: async (request, h) => {
                return {'data': {
                    'id': 20
                }}
            }
        }
    },
    {
        method: 'DELETE',
        path: '/questions/{questionId}',
        description: "Delete the question with a given ID."
        options: {
            tags: ['api'],
            handler: async (request, h) => {
                return {'data': {
                    'id': 20
                }}
            }
        }
    }
];
