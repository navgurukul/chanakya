'use strict';

module.exports = [
    {
        method: 'GET',
        path: '/questions',
        options: {
            description: "Return a list of all the questions.",
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
        options: {
            description: "Create a new question.",
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
        options: {
            description: "Get details of the question with the given ID.",
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
        options: {
            description: "Edit the question with a given ID.",
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
        options: {
            description: "Delete the question with a given ID.",
            tags: ['api'],
            handler: async (request, h) => {
                return {'data': {
                    'id': 20
                }}
            }
        }
    }
];
