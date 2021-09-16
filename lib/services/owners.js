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

module.exports = class OwnersService extends Schmervice.Service {
  async newOwner(owner) {
    const { Owners } = this.server.models();
    return await Owners.query().insert(owner);
  }
  async updateOwner(owner, id) {
    const { Owners } = this.server.models();
    return await Owners.query().update(owner).where("id", id);
  }
  async findall() {
    const { Owners } = this.server.models();
    return await Owners.query();
  }
  async autoAssignFeat(details, feedbackService) {
    const { Owners } = this.server.models();
    const assing_to = await Owners.query()
      .where("available", "YES")
      .orderBy(["pending_interview_count", "createdOrUpdated_at", "name"]);
    if (assing_to.length > 0) {
      const to_assign = assing_to[0].name;
      console.log(assing_to[0], to_assign);
      // await Owners.query().update({ pending_interview_count: 9 }).where("id", 2);
      const assignWork = await feedbackService.assignFeedbackWork({
        ...details,
        to_assign,
      });
    }
  }
};
