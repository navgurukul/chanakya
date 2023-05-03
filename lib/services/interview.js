const Schmervice = require("schmervice");
module.exports = class interviewService extends Schmervice.Service {
    async insertOrUpdateStudentDetails(id,data){
    const {  Interview } = this.server.models();
    const details = await Interview.query().where('student_id',id)
    let changes;
    if (details.length===0){
        changes = await Interview.query().insert({student_id:id,...data})
    }else{
        changes = await Interview.query().update({student_id:id,...data}).where('student_id',id)
    }
    return changes
  }
}