/* eslint-disable no-return-await */
/* eslint-disable guard-for-in */
/* eslint-disable no-shadow */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-unused-vars */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable camelcase */
/* eslint-disable no-await-in-loop */
const Schmervice = require("schmervice");
const Joi = require("joi");
const _ = require("lodash");
const { val } = require("objection");

module.exports = class EmailReportService extends Schmervice.Service {
  async findall() {
    const { EmailReport } = this.server.models();
    return await EmailReport.query();
  }
  async getEmailReportsById(id, txn = null) {
    const partnerId = id;
    const { EmailReport } = this.server.models();

    const emailReport = await EmailReport.query(txn).where(
      "partner_id",
      partnerId
    );
    return emailReport;
  }
  async create(data) {
    const { EmailReport } = this.server.models();
    if (data.emails) {
      data.emails = val(data.emails).asArray().castTo("text[]");
    }
    return await EmailReport.query().insert(data);
  }
  async updateById(data, id) {
    const { EmailReport } = this.server.models();
    if (data.emails) {
      data.emails = val(data.emails).asArray().castTo("text[]");
    }
    return await EmailReport.query().update(data).where("id", id);
  }

  async deleteById(id) {
    const { EmailReport } = this.server.models();
    return await EmailReport.query().delete().where("id", id);
  }
  async getPartners() {
    const { EmailReport } = this.server.models();
    const data = await EmailReport.query().select(
      "partner_id",
      "emails",
      "report",
      "repeat"
    );
    return data;
  }
};