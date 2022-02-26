const Schmervice = require("schmervice");

module.exports = class ownerScheduleService extends Schmervice.Service {
  async create(data) {
    const { OwnerSchedule } = this.server.models();
    try {
      return await OwnerSchedule.query().insert(data);
    } catch (err) {
      return {
        message: err.message,
      };
    }
  }
  async get() {
    const { OwnerSchedule } = this.server.models();
    return await OwnerSchedule.query();
  }
  async getById(owner_id) {
    const { OwnerSchedule } = this.server.models();
    try {
      return await OwnerSchedule.query().where({ owner_id });
    } catch (e) {
      return {
        message: e.message,
      };
    }
  }
  async update(owner_id, data) {
    const { OwnerSchedule } = this.server.models();

    try {
      await OwnerSchedule.query().update(data).where({ owner_id });
      return await this.getById(owner_id);
    } catch (e) {
      return { message: e.message };
    }
  }
  async delete(owner_id) {
    const { OwnerSchedule } = this.server.models();
    try {
      return await OwnerSchedule.query().delete().where({ owner_id });
    } catch (e) {
      return { message: e.message };
    }
  }
};
