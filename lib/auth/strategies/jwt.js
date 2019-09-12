'use strict';

const Bounce = require('bounce');
const { NotFoundError } = require('objection');
const CONSTANTS = require('../../constants');
const _ = require("underscore");

module.exports = (server, options) => ({
    scheme: 'jwt',
    options: {
        key: options.jwtKey,
        urlKey: false,
        cookieKey: false,
        verifyOptions: { algorithms: ['HS256'] },
        validate: async (decoded, request) => {
            
            const { userService } = request.services();

            try {
                let user = await userService.findById(decoded.id);
                user.scope = _.invert(CONSTANTS.userTypes)[ user.type ];

                return {
                    isValid: true,
                    credentials: user
                }
            }
            catch (error) {
                Bounce.ignore(error, NotFoundError);
                return {
                    isValid: false
                }
            }

        }
    }
});
