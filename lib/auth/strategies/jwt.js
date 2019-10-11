
const Bounce = require('bounce');
const { NotFoundError } = require('objection');
const _ = require('underscore');
const CONSTANTS = require('../../constants');

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
        const user = await userService.findById(decoded.id);
        user.scope = _.invert(CONSTANTS.userTypes)[user.type];

        return {
          isValid: true,
          credentials: user,
        };
      } catch (error) {
        Bounce.ignore(error, NotFoundError);
        return {
          isValid: false,
        };
      }
    },
  },
});
