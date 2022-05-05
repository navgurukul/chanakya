const Schmervice = require("schmervice");
module.exports = class StudentDocumentsService extends Schmervice.Service {
    async insertOrUpdate(id,data){
    const {  studentDocuments } = this.server.models();
    const documents = await studentDocuments.query().where('student_id',id)
    let changes;
    if (documents.length===0){
        changes = await studentDocuments.query().insert({student_id:id,...data})
    }else{
        changes = await studentDocuments.query().update({student_id:id,...data}).where('student_id',id)
    }
    return changes
  }
}