'use strict';

module.exports = [
    {
        method: 'GET',
        path: '/partners',
        options: {
            description: "List of all partners in the system.",
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    },
    {
        method: 'POST',
        path: '/partners',
        options: {
            description: "Create a new partner.",
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    },
    {
        method: 'GET',
        path: '/partners/{partnerId}',
        options: {
            description: "Get partner details with the given ID.",
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    },
    {
        method: 'PUT',
        path: '/partners/{partnerId}',
        options: {
            description: "Edit partner details with the given ID.",
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    },
    {
        method: 'DELETE',
        path: '/partners/{partnerId}',
        options: {
            description: "Delete a partner with the given ID.",
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    }
];
