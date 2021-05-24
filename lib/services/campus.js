const Schmervice = require("schmervice");

module.exports = class CampusService extends Schmervice.Service {
  async updateOrInsertById(studentId, campus) {
    const { Campus } = this.server.models();
    const Count = await Campus.query().where("student_id", studentId).count();
    let campusUpdate;
    if (Count[0].count > 0) {
      campusUpdate = await Campus.query().where("student_id", studentId).patch({ student_id:studentId, campus });
    } else {
      campusUpdate = await Campus.query().insertGraph({  student_id:studentId, campus });
    }
    return campusUpdate;
  }
};
