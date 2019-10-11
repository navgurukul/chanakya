
const Joi = require('joi');
const Schwifty = require('schwifty');
const { DbErrors } = require('objection-db-errors');
const _ = require('underscore');

exports.Model = class extends DbErrors(Schwifty.Model) {
  static createNotFoundError(ctx) {
    const error = super.createNotFoundError(ctx);

    return Object.assign(error, {
      modelName: this.name,
    });
  }

  static field(name) {
    return Joi.reach(this.getJoiSchema(), name)
      .optional()
      .options({ noDefaults: true });
  }

  static fields() {
    return _.keys(this.getJoiSchema().describe().children);
  }
};
