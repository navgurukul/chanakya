const Joi = require('joi');
const path = require('path');
const { Model } = require('./helpers');

//PGSQL Query
// CREATE TABLE whatsapp_outreach (
//     id SERIAL PRIMARY KEY,
//     name VARCHAR(255) NOT NULL,
//     contact_number VARCHAR(50) NOT NULL,
//     is_active BOOLEAN DEFAULT TRUE,
//     message_sent BOOLEAN DEFAULT FALSE,
//     responded BOOLEAN DEFAULT FALSE,
//     created_at TIMESTAMP
// );

module.exports = class WhatsappOutreach extends Model {
  static get tableName() {
    return 'whatsapp_outreach';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      name: Joi.string().required(),
      contact_number: Joi.string().required(),
      is_active: Joi.boolean().default(true),
      message_sent: Joi.boolean().default(false),
      responded: Joi.boolean().default(false),
      created_at: Joi.date(),
    });
  }

  $beforeInsert() {
    this.created_at = new Date();
  }
};