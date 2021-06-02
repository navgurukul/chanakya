const Schmervice = require("schmervice");
const Joi = require("joi");
const _ = require("lodash")
const { val } = require("objection");

module.exports = class StudentDonorService extends Schmervice.Service {
  async updateOrInsertById(studentId, donor_id) {
    const { StudentDonor } = this.server.models();
    const Count = await StudentDonor.query().where("student_id", studentId).count();
    // console.log({  student_id:studentId, donor_id:val(donor_id).asArray().castTo("text[]") },"count");
    let donorUpdate;
    if (Count[0].count > 0) {
        donorUpdate = await StudentDonor.query().where("student_id", studentId).patch({  student_id:studentId, donor_id:val(donor_id).asArray().castTo("text[]") });
    } else {
        donorUpdate = await StudentDonor.query().insertGraph({  student_id:studentId, donor_id:val(donor_id).asArray().castTo("text[]") });
    }
    return donorUpdate;
  }
};