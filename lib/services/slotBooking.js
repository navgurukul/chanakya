const Schmervice = require("schmervice");
const Boom = require("boom");

module.exports = class SlotBookingService extends Schmervice.Service {
  async create(data) {
    console.log("creating the owner");
    const { InterviewSlotResource } = this.server.models();
    return await InterviewSlotResource.query().insert(data);
  }
};
