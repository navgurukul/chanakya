const Schmervice = require('schmervice');

module.exports = class studentStage extends Schmervice.Service {
  async updateOrInsertStudentStage(studentId,stage) {
    const { StudentStage } = this.server.models();
    const stageData = await StudentStage.query().where('student_id', studentId);
    let stageUpdate;
    if (stageData.length===0){
        stageUpdate = await StudentStage.query().insert({student_id:studentId,...stage})
    }else{
        stageUpdate = await StudentStage.query().update({student_id:studentId,...stage}).where('student_id',studentId)
    }
    return stageUpdate
  }
};
