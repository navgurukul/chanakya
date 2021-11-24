const Schmervice = require("schmervice");

module.exports = class DashboardFlagServcies extends Schmervice.Service {
  async create(student_id, flag) {
    const { DashboardFlag } = this.server.models();
    const data = await DashboardFlag.query().insert({
      student_id: student_id,
      flag: flag,
    });
    return data;
  }
  async update(student_id, flag) {
    console.log("Working updaying .........", student_id);
    const { DashboardFlag } = this.server.models();
    const UpdatedFlag = await DashboardFlag.query()
      .patch({ flag })
      .where("student_id", student_id);
    console.log(UpdatedFlag);
    return UpdatedFlag;
  }
  async getById(student_id, txn = null) {
    const { DashboardFlag } = this.server.models();
    const data = await DashboardFlag.query(txn).where("student_id", student_id);
    return data;
  }
  async getAll() {
    const { DashboardFlag } = this.server.models();
    const data = await DashboardFlag.query();
    return data;
  }
  async delete(student_id, txn = null) {
    const { DashboardFlag } = this.server.models();
    const data = await DashboardFlag.query(txn)
      .delete()
      .where("student_id", student_id);
    return data;
  }
};
