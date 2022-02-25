const Boom = require("boom");
const Schmervice = require("schmervice");
const _ = require("underscore");
const CONSTANTS = require("../constants");

module.exports = class StudnetInterviewSlot extends Schmervice.Service {
  /**
   *
   * @param {*} data
   * @returns
   */
  async create(data) {
    const { start_time, end_time_expected } = data;
    const { InterviewSlot } = this.server.models();
    const { OwnerSchedule } = this.server.models();
    try {
      // 1.getting the owners avilable in the requried time
      // SELECT owner.name, owner.id schedule.from, schedule.to
      // FROM schedule, employee
      // WHERE schedule.owner_id = owner.id
      // AND schedule.from >= @starttime
      // AND schedule.to <= @endtime;

      const owners = await OwnerSchedule.query()
        .select(
          "owner_schedule.id",
          "owner_schedule.from",
          "owner_schedule.to",
          "owner.id as owner_id",
          "owner.user_id"
        )
        .joinRelated("owner")
        .where("owner_schedule.from", "<=", start_time)
        .andWhere("owner_schedule.to", ">=", end_time_expected);

      console.log("shedule_owneres", owners);
      /**
     * SELECT COUNT(*) AS interview_slot_count
      FROM interview, interview_owner
      WHERE appointment.employee_id = employee.id
      AND appointment.start_time >= @desired_time
      AND appointment.end_time_expected <= @desired_time
      AND appointment.employee_id = @desired_employee;
      */

      const owner_ids = owners.map((i) => i.owner_id);
      let slot_data;
      for await (const owner_id of owner_ids) {
        const slotsBooked = await InterviewSlot.query()
          .count()
          .joinRelated("owner")
          .where("interview_slot.owner_id", owner_id)
          .where("interview_slot.start_time", "=", start_time)
          .andWhere("interview_slot.end_time_expected", "=", end_time_expected);
        if (slotsBooked[0].count == 0) {
          data.owner_id = owner_id;
          data.status = "Interview Scheduled successfully";
          slot_data = data;
          break;
        }
      }
      if (slot_data === null || slot_data === undefined) {
        return {
          message: "please try different slot!",
        };
      }
      const result = await InterviewSlot.query().insert(slot_data);
      return result;
    } catch (error) {
      return error.message;
    }
  }
  async update(data, id) {
    const { InterviewSlot } = this.server.models();

    const updated = await InterviewSlot.query().update(data).where({ id });
    return updated;
  }
  async delete(id) {
    const { InterviewSlot } = this.server.models();

    const deleted = await InterviewSlot.query().delete().where({ id });
    return deleted;
  }
  async getAllSlots() {
    const { InterviewSlot } = this.server.models();
    const data = await InterviewSlot.query();
    return data;
  }
  async getSlotById(id) {
    const { InterviewSlot } = this.server.models();
    const data = await InterviewSlot.query().where({ id });
    return data;
  }
};
