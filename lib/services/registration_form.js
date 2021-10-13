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

module.exports = class RegistrationFormService extends Schmervice.Service {
  async findall() {
    const { registrationForm } = this.server.models();
    return await registrationForm.query();
  }
  async findStructureByPartnerId(partnerId) {
    const { registrationForm } = this.server.models();
    return await registrationForm.query().where("partner_id", partnerId);
  }
  async createFormStructureForAPartner(partnerId, formStructure) {
    const { registrationForm } = this.server.models();
    return await registrationForm
      .query()
      .insert({ partner_id: partnerId, form_structure: formStructure });
  }
  async registerAStudentForAPartner(partnerId, formData) {
    const { registrationFormData } = this.server.models();
    return await registrationFormData
      .query()
      .insert({ partner_id: partnerId, form_data: formData });
  }

  async findRegisteredDataByPartnerId(partnerId) {
    const { registrationFormData } = this.server.models();
    return await registrationFormData.query().where("partner_id", partnerId);
  }

  async updateFormStructureForAPartner(partnerId, formStructure) {
    const { registrationForm } = this.server.models();
    return await registrationForm
      .query()
      .update({ partner_id: partnerId, form_structure: formStructure })
      .where({ partner_id: partnerId });
  }
  async deleteFormStructureForAPartner(partnerId) {
    const { registrationForm } = this.server.models();
    return await registrationForm
      .query()
      .delete()
      .where({ partner_id: partnerId });
  }
};
