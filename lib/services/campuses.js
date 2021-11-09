/* eslint-disable max-len */
/* eslint-disable no-return-await */
/* eslint-disable no-unused-vars */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable camelcase */
const Schmervice = require('schmervice');
const Boom = require('boom');
const _ = require('lodash');

module.exports = class CampusService extends Schmervice.Service {
  async updateOrInsertById(studentId, campus) {
    const { Campus } = this.server.models();
    const { studentCampus } = this.server.models();
    const StudentCampusStudentId = await studentCampus
      .query()
      .where('student_id', studentId);
    if (StudentCampusStudentId.length > 0) {
      var { id } = StudentCampusStudentId[0];
    }
    const campus_id = await Campus.query().select('id').where('campus', campus);
    if (campus_id.length === 0) {
      throw Boom.badRequest('seed initial campus data');
    }
    const campusUpdate = await studentCampus.query().upsertGraph({
      id: id,
      student_id: studentId,
      campus_id: campus_id[0].id,
    });
    return { success: true };
  }

  async findall() {
    const { Campus } = this.server.models();
    return await Campus.query();
  }
};
