'use strict';
const Joi = require('joi');
const CONSTANTS = require('../constants');
const _ = require("underscore");

const internals = {};
internals.userSchema = Joi.object({
    name: Joi.string().required(),
    type: Joi.number().integer().valid( ..._.values(CONSTANTS.userTypes)),
    email: Joi.string().email().required(),
    mobile: Joi.string().length(10).required(),
    password: Joi.binary().required(),
    partnerId: Joi.number().integer()
})

module.exports = [
    {
        method: 'POST',
        path: '/users/login/credentials',
        options: {
            description: "Login with email/password combination.",
            tags: ['api'],
            validate: {
                payload: {
                    email: Joi.string().email().required().lowercase(),
                    password: Joi.string().required()
                }
            },
            handler: async (request, h) => {       
                const { userService } = request.services();
                
                const { email, password } = request.payload;
                
                let user = await userService.login({email, password});
                let token = await userService.createToken(user);
                
                return {
                    token: token,
                    user: user
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/users/me',
        options: {
            auth: {
                strategy: 'jwt',
                access: {
                    scope: ['team']
                }
            },
            description: "Get the details of a logged in user.",
            tags: ['api'],
            handler: async (request, h) => {
                return { token: 'hello' }
            }
        }
    },

    {
        method: 'GET',
        path: '/users',
        options: {
            auth: {
                strategy: 'jwt',
                access: {
                    scope: ['team', 'student']
                }
            },
            description: 'Get all users details or particular type of user',
            tags: ['api'],
            validate: {
                query: {
                    type: Joi.number().integer().valid( ..._.values(CONSTANTS.userTypes))
                }
            }
        },
        handler: async (request, h) => {
            const { userService } = request.services();
        
            if (request.query.type){
                let user = await userService.findByType(request.query.type);
                return { data: user }
            }else{
                let users = await userService.findAll();
                return { data: users }
            }
        }
    },

    {
        method: 'POST',
        path: '/users',
        options: {
            auth: {
                strategy: 'jwt',
                access: {
                    scope: ['team']
                }
            },
            description: 'Create new user.',
            tags: ['api'],
            validate: {
                payload : internals.userSchema
            },
            
            handler: async (request, h) => {
                const { userService } = request.services();
                let users = await userService.signUp(request.payload);
                await userService.sendSMSandEmailtoUser(request.payload)
                return { data: users } 
            }
        }
    },
    
    {
        method: "PUT", 
        path: '/users/{userId}',
        options: {
            description: 'Update user details with the given ID.',
            tags:['api'],
            validate: {
                params: {
                    userId: Joi.number().integer()
                },
                payload: internals.userSchema
            },
            handler: async (request, h) => {
                const { userService } = request.services();
                let user = await userService.findById(request.params.userId);
                await userService.userUpdate(request.params.userId, request.payload);
                return { data: user }
            }
        }
    },

    {
        method: "GET",
        path: '/users/{userId}',
        options: {
            description: "Get user details given by userId.",
            tags: ['api'],
            validate: {
                params: {
                    userId: Joi.number().integer()
                }
            },

            handler: async (request, h) => {
                const { userService } = request.services();
                let user = await userService.findById(request.params.userId);
                return { data: user}
            }
        }
    }
]
