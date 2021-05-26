const Schmervice = require('schmervice');

module.exports = class DonorService extends Schmervice.Service {
  async updateOrInsertById(studentId, donor) {
    const { Donor } = this.server.models();
    const Count = await Donor.query().where('student_id', studentId).count();
    let donorUpdate;
    if (Count[0].count > 0) {
        donorUpdate = await Donor.query().where('student_id', studentId).patch({ student_id:studentId, donor });
    } else {
        donorUpdate = await Donor.query().insertGraph({  student_id:studentId, donor });
    }
    return donorUpdate;
  }
};
