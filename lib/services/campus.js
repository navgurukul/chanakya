const Schmervice = require('schmervice');

module.exports = class CampusService extends Schmervice.Service {
  async updateById(student_id, campus, txn = null) {
    const { Campus } = this.server.models();
    const Count = await Campus.query().where("student_id",student_id).count()
    if (Count[0].count > 0){
        var campusUpdate = await Campus.query().where("student_id",student_id).patch({ student_id, campus } );
    }else{
        var campusUpdate = await Campus.query().insertGraph({ student_id, campus } );
    }
    return campusUpdate;  
  }
};
