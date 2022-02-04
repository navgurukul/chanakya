const Bounce = require("bounce");
const { NotFoundError } = require("objection");
const CONSTANTS = require("../../constants");
const _ = require("lodash");
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
        let [err, user] = await userService.findById(decoded.id, "roles");
        user.scope = _.map(user.roles, (r) => r.role);
        user = _.omit(user, "roles");
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
