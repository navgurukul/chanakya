const Boom = require('boom');
const Schmervice = require('schmervice');
const _ = require('underscore');
const logger = require('../../server/logger');

module.exports = class StudnetInterviewSlot extends Schmervice.Service {
  /**
   *
   * @param {*} data
   * @returns
   */
  async create(data) {
    const { start_time, end_time_expected, student_id, on_date } = data;
    const { InterviewSlot, Owners, Users } = this.server.models();
    const { studentService } = this.server.services();

    try {
      // 1.getting the owners avilable in the requried time
      // SELECT owner.name, owner.id schedule.from, schedule.to
      // FROM schedule, employee
      // WHERE schedule.owner_id = owner.id
      // AND schedule.from >= @starttime
      // AND schedule.to <= @endtime;
      const studentDetail = await studentService.getStudentById(student_id);
      /**
     * SELECT COUNT(*) AS interview_slot_count
      FROM interview, interview_owner
      WHERE appointment.employee_id = employee.id
      AND appointment.start_time >= @desired_time
      AND appointment.end_time_expected <= @desired_time
      AND appointment.employee_id = @desired_employee;
      */
      let slot_data;
      if (studentDetail[0].feedbacks) {
        const owner_name = studentDetail[0].feedbacks.to_assign;
        const user_id = await Users.query().where('mail_id', owner_name);
        const owner = await Owners.query().where('user_id', user_id[0].id);
        const owner_id = owner[0].id;
        const slotsBooked = await InterviewSlot.query()
          .count()
          .joinRelated('owner')
          .where('interview_slot.owner_id', owner_id)
          .where('interview_slot.start_time', '=', start_time)
          .andWhere('interview_slot.end_time_expected', '=', end_time_expected)
          .andWhere('interview_slot.on_date', on_date);
        if (slotsBooked[0].count == 0) {
          data.owner_id = owner_id;
          data.status = 'successfully_scheduled';
          slot_data = data;
        }
      } else {
        const slotsBooked = await InterviewSlot.query()
          .count()
          .where('interview_slot.start_time', '=', start_time)
          .andWhere('interview_slot.end_time_expected', '=', end_time_expected)
          .andWhere('interview_slot.on_date', on_date);

        if (slotsBooked[0].count == 0) {
          data.status = 'successfully_scheduled';
          slot_data = data;
        }
      }
      if (slot_data === null || slot_data === undefined) {
        return {
          message: 'please try different slot!',
        };
      }
      const result = await InterviewSlot.query().insert(slot_data);
      return result;
    } catch (error) {
      logger.error(JSON.stringify(error));
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

  async getAllByStudentId(studentId) {
    const { InterviewSlot } = this.server.models();
    const data = await InterviewSlot.query().where({ student_id: studentId });
    return data;
  }

  async getAllSlotsByDate(onDate) {
    const { InterviewSlot } = this.server.models();
    const data = await InterviewSlot.query()
      .where({ on_date: onDate })
      .withGraphFetched('[user(selectUserName),student(selectNameAndEmail),contacts(selectMobile)]')
      .modifiers({
        selectNameAndEmail(builder) {
          builder.select('name', 'email');
        },
        selectMobile(builder) {
          builder.select('mobile');
        },
        selectUserName(builder) {
          builder.select('user_name');
        },
      });
    return data;
  }
};
