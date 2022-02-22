const Schmervice = require("schmervice");
const Boom = require("boom");

module.exports = class ownerScheduleService extends Schmervice.Service {
  async create(data) {
    console.log("creating the owner",data);
    const { OwnerSchedule } = this.server.models();
    try{
        return await OwnerSchedule.query().insert(data);
    }catch(err){
        return {error:true,err}
    }
  }
  async get() {
    const { OwnerSchedule } = this.server.models();
    return await OwnerSchedule.query()
  }
  async getById(id) {
      console.log(id)
    const { OwnerSchedule } = this.server.models();
    return await OwnerSchedule.query().where({id})
  }
  
//   async getByOwnerId(owner_id) {
//     const { OwnerSchedule } = this.server.models();
//     return await OwnerSchedule.query().where({owner_id})
//   }
  async update(id,data){
    const { OwnerSchedule } = this.server.models();
    console.log(data)
    await OwnerSchedule.query().update(data).where({id})
    return await this.getById(id)
  }
  async delete(id){
    const { OwnerSchedule } = this.server.models();
    return await OwnerSchedule.query().delete().where({id})
  }
};
