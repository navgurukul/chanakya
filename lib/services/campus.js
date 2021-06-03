const Schmervice = require("schmervice");
const _ = require("lodash");
module.exports = class CampusService extends Schmervice.Service {
  async updateOrInsertById(studentId, campus) {
    const { Campus } = this.server.models();
    const { studentCampus } = this.server.models();
    const campus_id = await Campus.query().select("id").where("campus", campus);
    let campusUpdate = await studentCampus
      .query()
      .upsertGraph({ student_id: studentId, campus_id: campus_id[0].id });
    return campusUpdate;
  }

  async findall() {
    const { Campus } = this.server.models();
    return await Campus.query();
  }
};
