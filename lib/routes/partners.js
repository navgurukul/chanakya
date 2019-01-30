'use strict';

module.exports = [
    {
        method: 'GET',
        path: '/partners',
        description: "List of all partners in the system."
        options: {
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    },
    {
        method: 'POST',
        path: '/partners',
        description: "Create a new partner."
        options: {
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    },
    {
        method: 'GET',
        path: '/partners/{partnerId}',
        description: "Get partner details with the given ID."
        options: {
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    },
    {
        method: 'PUT',
        path: '/partners/{partnerId}',
        description: "Edit partner details with the given ID."
        options: {
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    },
    {
        method: 'DELETE',
        path: '/partners/{partnerId}',
        description: "Delete a partner with the given ID."
        options: {
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    }
];
