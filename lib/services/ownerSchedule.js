const Schmervice = require("schmervice");
const Boom = require("boom");

module.exports = class ownerScheduleService extends Schmervice.Service {
  async create(data) {
    console.log("creating the owner", data);
    const { OwnerSchedule } = this.server.models();
    try {
      return await OwnerSchedule.query().insert(data);
    } catch (err) {
      return { error: true, err };
    }
  }
  async get() {
    const { OwnerSchedule } = this.server.models();
    return await OwnerSchedule.query();
  }
  async getById(owner_id) {
    const { OwnerSchedule } = this.server.models();
    return await OwnerSchedule.query().where({ owner_id });
  }

  //   async getByOwnerId(owner_id) {
  //     const { OwnerSchedule } = this.server.models();
  //     return await OwnerSchedule.query().where({owner_id})
  //   }
  async update(owner_id, data) {
    const { OwnerSchedule } = this.server.models();
 
    await OwnerSchedule.query().update(data).where({ owner_id });
    return await this.getById(id);
  }
  async delete(owner_id) {
    const { OwnerSchedule } = this.server.models();
    return await OwnerSchedule.query().delete().where({ owner_id });
  }
};
