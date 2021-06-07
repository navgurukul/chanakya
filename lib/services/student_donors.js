/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */
/* eslint-disable import/no-extraneous-dependencies */
const Schmervice = require("schmervice");
const Joi = require("joi");
const _ = require("lodash");
const { val } = require("objection");

module.exports = class StudentDonorService extends Schmervice.Service {
  async updateOrInsertById(studentId, donor_id) {
    const { StudentDonor } = this.server.models();
    if (donor_id.length === 0) {
      await StudentDonor.query().where("student_id", studentId).delete();
      return { success: true };
    }
    const studentDonorByStudentID = await StudentDonor.query().where(
      "student_id",
      studentId
    );
    if (studentDonorByStudentID.length > 0) {
      var id = studentDonorByStudentID[0].id;
    }
    let donorUpdate = await StudentDonor.query().upsertGraph({
      id: id,
      student_id: studentId,
      donor_id: val(donor_id).asArray().castTo("text[]"),
    });
    return { success: true };
  }
};
