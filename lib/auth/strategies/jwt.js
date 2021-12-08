const Bounce = require("bounce");
const { NotFoundError } = require("objection");
const CONSTANTS = require("../../constants");

module.exports = () => ({
  scheme: "jwt",
  options: {
    key: CONSTANTS.users.jwt.secret,
    urlKey: false,
    cookieKey: false,
    verifyOptions: { algorithms: ["HS256"] },
    validate: async (decoded, request) => {
      const { userService } = request.services();

      try {
        const user = await userService.findById(decoded.id);
        // user.scope = _.invert(CONSTANTS.userTypes)[user.type];
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
