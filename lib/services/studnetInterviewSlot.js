const Boom = require("boom");
const Schmervice = require("schmervice");
const _ = require("underscore");
const CONSTANTS = require("../constants");

module.exports = class StudnetInterviewSlot extends Schmervice.Service {
  async create(data) {
    const { start_time, end_time_expected } = data;
    console.log("start_time", start_time, end_time_expected);
    const { InterviewSlot } = this.server.models();
    const { OwnerSchedule } = this.server.models();
    const { Owners } = this.server.models();

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
      .where("owner_schedule.to", ">=", end_time_expected);
    console.log("owner", owners);
    /**
     * SELECT COUNT(*) AS interview_slot_count
      FROM interview, interview_owner
      WHERE appointment.employee_id = employee.id
      AND appointment.start_time >= @desired_time
      AND appointment.end_time_expected <= @desired_time
      AND appointment.employee_id = @desired_employee;
     */

    const owner_ids = owners.map((i) => i.owner_id);
    console.log("ids", owner_ids);

    const avilable_ownes_count = await InterviewSlot.query()
      .select("owner.id as owner_id")
      .joinRelated("owner")
      .where("interview_slot.start_time", "<=", start_time)
      .where("interview_slot.end_time_expected", ">=", end_time_expected)
      .whereIn("interview_slot.owner_id", owner_ids);

    owner_ids.filter((i) => i != avilable_ownes_count.owner_id);

    console.log("avilable_ownes_count ::", owner_ids);

    /**
       * SELECT a.desired_time, a.owner_working,b.slot_booked
      FROM
      (
          SELECT '08:00' AS "desired_time", COUNT(*) AS owner_working
          FROM owner_schedule
          WHERE owner_schedule.from <= '08:00'
          AND owner_schedule.to >= '09:00'
      ) AS a
      
      LEFT JOIN
 
      (
          SELECT '08:00' AS "desired_time", COUNT(*) AS slot_booked
          FROM interview_slot, interview_owners
          WHERE interview_slot.owner_id = interview_owners.id
          AND interview_slot.start_time <= '08:00'
          AND interview_slot.end_time_expected <= '09:00'
      ) AS b 
      
      ON a.desired_time = b.desired_time
       */
    return {
      testing: owners,
    };
  }
};
