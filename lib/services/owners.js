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
    const { id } = await Owners.query().insert(owner);
    return await Owners.query().where({ id }).eager("user");
  }
  async updateOwner(owner, id) {
    const { Owners } = this.server.models();
    if (owner.type) {
      owner.type = val(owner.type).asArray().castTo("text[]");
    }
    await Owners.query().update(owner).where("id", id);
    return await Owners.query().where("id", id).eager("user");
  }
  async findall(query) {
    const { Owners } = this.server.models();
    if (query) {
      return await Owners.query().where(query).eager("user");
    }
    return await Owners.query().eager("user");
  }
  async findById(id) {
    const { Owners } = this.server.models();
    return await Owners.query().where("id", id).eager("user");
  }
  async pendingInterviewUpdate(ownerId) {
    const { Owners, Student } = this.server.models();

    const owner = await Student.query().where("current_owner_id", ownerId);
    console.log("ownerid count", ownerId, owner.length);
    await Owners.query()
      .update({ pending_interview_count: owner.length })
      .where("id", ownerId);
  }
  async pendingInterviewUpdateByToAssign(details) {
    const { Owners, Student, Users } = this.server.models();
    if (
      ![
        "pendingEnglishInterview",
        "pendingAlgebraInterview",
        "pendingCultureFitInterview",
      ].includes(details.student_stage)
    ) {
      return 0;
    }
    const user = await Users.query().where("mail_id", details.to_assign);
    console.log("comming", user, details);
    if (user.length > 0) {
      var owner = await Owners.query().where("user_id", user[0].id);
      if (owner.length === 0) {
        var owner = await this.newOwner({
          user_id: user[0].id,
          available: true,
          type: [details.student_stage],
          pending_interview_count: 1,
        });
      }
      const studentData = await Student.query().where("id", details.student_id);
      console.log(studentData[0].current_owner_id);
      await Student.query()
        .update({ current_owner_id: owner[0].id })
        .where("id", details.student_id);
      console.log(studentData[0].current_owner_id);

      await this.pendingInterviewUpdate(owner[0].id);
      if (studentData[0] && studentData[0].current_owner_id) {
        await this.pendingInterviewUpdate(studentData[0].current_owner_id);
      }
    }
  }
  async deleteOwnerById(id) {
    const { Owners } = this.server.models();
    const owner = await Owners.query().where("id", id);
    if (owner.length === 0) {
      return "This ownerId is not present";
    }
    try {
      await Owners.query().delete().where("id", id);
      return true;
    } catch (err) {
      return "Delete only when pending interview count is 0";
    }
  }
  async autoAssignFeat(details, feedbackService, stage, student_id) {
    const { Owners, Student } = this.server.models();
    let gender = await Student.query().select("gender").where("id", student_id);
    var assing_to = await Owners.query()
      .where("available", true)
      .where("gender", gender[0].gender)
      .whereRaw(`'${stage.slice(7)}'= ANY(type) `)
      .orderBy(["pending_interview_count"])
      .eager("user");
    console.log(assing_to, stage.slice(7));
    assing_to = assing_to.filter((data) => {
      if (data.pending_interview_count < data.max_limit) {
        return true;
      }
      return false;
    });
    if (assing_to.length > 0) {
      const to_assign = assing_to[0].user.mail_id;
      await Student.query()
        .update({ current_owner_id: assing_to[0].id })
        .where("id", student_id);
      const assignWork = await feedbackService.assignFeedbackWork({
        ...details,
        to_assign,
      });
      await this.pendingInterviewUpdate(assing_to[0].id);
    } else {
      console.log("no owners available");
    }
  }
};
