const Schmervice = require('schmervice');
const Boom = require('boom');
const _ = require('lodash');
const logger = require('../../server/logger');


module.exports = class CampusService extends Schmervice.Service {
  async updateOrInsertById(studentId, campus) {
    const { Campus } = this.server.models();
    const { studentCampus } = this.server.models();
    const StudentCampusStudentId = await studentCampus.query().where('student_id', studentId);
    if (StudentCampusStudentId.length > 0) {
      var { id } = StudentCampusStudentId[0];
    }
    const campus_id = await Campus.query().select('id').where('campus', campus);
    if (campus_id.length === 0) {
      logger.error(
        JSON.stringify({
          error: true,
          message: 'seed initial campus data',
        })
      );
      throw Boom.badRequest('seed initial campus data');
    }
    const campusUpdate = await studentCampus.query().upsertGraph({
      id,
      student_id: studentId,
      campus_id: campus_id[0].id,
    });
    return { success: true };
  }

  async findall() {
    const { Campus } = this.server.models();
    const data = await Campus.query();
    return data;
  }

  // Create campuse 
  async createCampuse(details) {
    const { Campus } = this.server.models();
    try {
      const campusDetails = await Campus.query().insert(details)
      return campusDetails
    } catch (error) {
      logger.error(JSON.stringify(error));
      return [errorHandler(error), null];
    }
  }

  // update campuse details
  async updateCampuse(details, id) {
    const { Campus } = this.server.models();
    try {
      const updateDetails = await Campus.query().update(details).where('id', id);
      return updateDetails;
    } catch (error) {
      logger.error(JSON.stringify(error));
      return [errorHandler(error), null];
    }
  }

};
