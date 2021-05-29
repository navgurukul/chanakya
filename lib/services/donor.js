const Schmervice = require("schmervice");
const Joi = require("joi");
const _ = require("lodash")
module.exports = class DonorService extends Schmervice.Service {
  async updateOrInsertById(studentId, donor) {
    const { Donor } = this.server.models();
    const Count = await Donor.query().where("student_id", studentId).count();
    let donorUpdate;
    if (Count[0].count > 0) {
        donorUpdate = await Donor.query().where("student_id", studentId).patch({ student_id:studentId, donor });
    } else {
        donorUpdate = await Donor.query().insertGraph({  student_id:studentId, donor });
    }
    return donorUpdate;
  }
  
  async progressMade(donors_id) {
    const { StudentDonor } = this.server.models();
    const { Student } = this.server.models();
    const data = await StudentDonor.query()
    const convertedData = [];
    for (var i in data){
      if (data[i].donor_id.includes(donors_id)){
        const student = await Student.query().where("id",data[i].student_id)
        convertedData.push(student[0])
      }
    }
    return convertedData
  }
  

};
