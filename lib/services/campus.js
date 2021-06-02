const Schmervice = require("schmervice");
const _ = require("lodash");
module.exports = class CampusService extends Schmervice.Service {
  async updateOrInsertById(studentId, campus) {
    const { Campus } = this.server.models();
    const { studentCampus } = this.server.models();
    const Count = await studentCampus.query().where('student_id', studentId).count();
    let campusUpdate;
    if (Count[0].count > 0) {
      const campus_id = await Campus.query().select('id').where('campus', campus);
      campusUpdate = await studentCampus.query().where('student_id', studentId).patch({ student_id: studentId, campus_id: campus_id[0].id });
    } else {
      const campus_id = await Campus.query().select('id').where('campus', campus);
      campusUpdate = await studentCampus.query().insertGraph({ student_id: studentId, campus_id: campus_id[0].id });
    }
    return campusUpdate;
  }
  async findall(){
    const { Campus } = this.server.models();
    return await Campus.query()
  }
};
