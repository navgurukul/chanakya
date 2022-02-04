const Schmervice = require("schmervice");
const Joi = require("joi");
const _ = require("lodash");
const { val } = require("objection");
const { sendPartnersReports } = require("../helpers/sendEmail");
const { getTemplateData } = require("../helpers/partnersEmailReport");
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
  async sendEmailByPartnerId(partner_id) {
    try {
      const { partnerService } = this.server.services();
      const report = await this.getEmailReportsById(partner_id);
      const data = await partnerService.progressMade(partner_id);
      let res = getTemplateData(data);
      const { emails, repeat } = report[0];
      const name = await partnerService.findById(partner_id);
      res.link =
        partner_id != null
          ? `https://admissions.navgurukul.org/partner/${partner_id}`
          : "";
      res.timeLine = repeat != null ? repeat : "";
      res.partnerName = name.name != null ? name.name : " ";

      const pro = await sendPartnersReports(res, emails);
      if (pro.MessageId !== null) {
        return {
          message: "sent successfully",
        };
      }
      return {
        message: "Failed  try again",
      };
    } catch (err) {
      return {
        message: "Failed  try again",
      };
    }
  }
};
