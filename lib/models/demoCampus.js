const Joi = require('joi');
const { Model } = require('./helpers/index');

module.exports = class DemoCampus extends Model {
    static get tableName() {
        return 'demo_campus';
    }

    static get joiSchema() {
        return Joi.object({
            id: Joi.number().integer().greater(0),
            campus: Joi.string().required(),
            phone_no: Joi.number().integer().required()
        });

    }
};
