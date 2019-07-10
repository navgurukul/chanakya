'use strict';
const Joi = require('joi');

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
    }
]
