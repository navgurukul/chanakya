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

module.exports = class OwnersService extends Schmervice.Service {
  async newOwner(owner) {
    const { Owners } = this.server.models();
    if (owner.type) {
      owner.type = val(owner.type).asArray().castTo("text[]");
    }
    return await Owners.query().insert(owner);
  }
  async updateOwner(owner, id) {
    const { Owners } = this.server.models();
    if (owner.type) {
      owner.type = val(owner.type).asArray().castTo("text[]");
    }
    return await Owners.query().update(owner).where("id", id);
  }
  async findall(query) {
    const { Owners } = this.server.models();
    if (query) {
      return await Owners.query().where(query).eager("user");
    }
    return await Owners.query().eager("user");
  }
  async autoAssignFeat(details, feedbackService, stage) {
    const { Owners } = this.server.models();
    const assing_to = await Owners.query()
      .where("available", true)
      .whereRaw(`'${stage.slice(7)}'= ANY(type) `)
      .orderBy(["pending_interview_count"])
      .eager("user");
    // console.log(assing_to, "slice stage");

    if (assing_to.length > 0) {
      const to_assign = assing_to[0].user.user_name;
      // console.log(assing_to[0], details, to_assign);
      // await Owners.query()
      //   .update({ pending_interview_count: 9 })
      //   .where("id", 2);
      const assignWork = await feedbackService.assignFeedbackWork({
        ...details,
        to_assign,
      });
    }
  }
};
