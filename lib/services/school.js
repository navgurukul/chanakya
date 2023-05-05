/* eslint-disable no-dupe-class-members */
/* eslint-disable max-len */
/* eslint-disable consistent-return */
/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */
/* eslint-disable import/no-extraneous-dependencies */
const Schmervice = require('schmervice');
const Joi = require('joi');
const _ = require('lodash');
const { val } = require('objection');
const { Store } = require('confidence');
const { errorHandler } = require('../../errors');
const logger = require('../../server/logger');

module.exports = class SchoolService extends Schmervice.Service {
  async school_name(student_name, id) {
    const { School, CampusSchool, StudentSchool, studentCampus } = this.server.models();
    try {
      const store = await School.query().insert({ name: student_name });
      // const store1 = await StudentSchool.query().insert({ student_id: id, school_id: store.id });
      // const store2 = await studentCampus.query().select('campus_id').where('id', id);
      // const store3 = await CampusSchool.query().insert({ school_id: store.id, campus_id: store2[0].campus_id });
      return store;
    } catch (err) {
      return err;
    }
  }

  async school_name_get(id) {
    const { School, CampusSchool, StudentSchool, studentCampus } = this.server.models();
    try {
      const store = await School.query().where('id', id);
      return store;
    } catch (err) {
      return err;
    }
  }

  async school_name_update(name, id) {
    const { School, CampusSchool, StudentSchool, studentCampus } = this.server.models();
    try {
      const store = await School.query().update({ name }).where('id', id);
      return store;
    } catch (err) {
      return err;
    }
  }

  async school_name_delete(id) {
    const { School, CampusSchool, StudentSchool, studentCampus } = this.server.models();
    try {
      const store = await School.query().deleteById(id);
      return store;
    } catch (err) {
      return err;
    }
  }

  async campus_school_post(campus_id, school_id) {
    const { CampusSchool } = this.server.models();
    try {
      const store = await CampusSchool.query().insert({ campus_id, school_id });
      return store;
    } catch (err) {
      return err;
    }
  }

  async schoolsAvailableInCampuses(campus_id) {
    const { CampusSchool } = this.server.models();
    try {
      const store = await CampusSchool.query()
        .select('campus_school.school_id', 'school.name', 'campus_school.capacity_of_student AS capacity')
        .join('school', 'campus_school.school_id', '=', 'school.id')
        .where('campus_id', campus_id);
      return store;
    } catch (err) {
      return err;
    }
  }

  async campus_school_delete(id) {
    const { CampusSchool } = this.server.models();
    try {
      const store = await CampusSchool.query().deleteById(id);
      return store;
    } catch (err) {
      return err;
    }
  }

  async campus_school_update(id, campus_id, school_id) {
    const { CampusSchool } = this.server.models();
    try {
      const store = await CampusSchool.query().update({ campus_id, school_id }).where('id', id);
      return store;
    } catch (err) {
      return err;
    }
  }

  async students_school_post(studentId, schoolId) {
    const { StudentSchool } = this.server.models();
    try {
      // console.log(student_id, school_id, 'student_id, school_id');

      const store = await StudentSchool.query().insert({ school_id: schoolId, student_id: studentId });
      return store;
    } catch (err) {
      return err;
    }
  }

  async students_school_get(id) {
    const { StudentSchool } = this.server.models();
    try {
      const store = await StudentSchool.query().where('id', id);
      return store;
    } catch (err) {
      return err;
    }
  }

  async students_school_delete(id) {
    const { StudentSchool } = this.server.models();
    try {
      const store = await StudentSchool.query().deleteById(id);
      return store;
    } catch (err) {
      return err;
    }
  }

  async students_school_update( student_id, school_id) {
    const { StudentSchool } = this.server.models();
    try {
      const store = await StudentSchool.query().update({ school_id }).where('student_id', student_id);
      return store;
    } catch (err) {
      return err;
    }
  }

  async allSchoolData() {
    const { School } = this.server.models();
    try {
      const store = await School.query();
      return store;
    } catch (err) {
      return err;
    }
  }


  async studentsAvailable_school(school_id) {
    const { Student, StudentSchool, StageTransition } = this.server.models();
    try {
      let student;
      if (school_id == 1) {
        const student_joined = (await StageTransition.query().where('to_stage','finallyJoined')).length 
        const student_dropout = (await StageTransition.query().where('to_stage','droppedOut')).length 
        const student_In_job = (await StageTransition.query().where('to_stage', 'inJob')).length
        const students_In_other_schools = (await StudentSchool.query()).length
        
        student = student_joined - (student_dropout + student_In_job + students_In_other_schools)
      }
      else {
        student = (await StudentSchool.query().where('school_id',school_id)).length
      }
      return [{length: student}];
    } catch (err) {
      return err;
    }
  }

  async getCampusesBySchool( school_id ) {
    const { CampusSchool } = this.server.models();
    try {
      const collect_data = await CampusSchool.query().select('campus_id')
      .where('school_id',school_id);
      return collect_data;
    } catch (err) {
      logger.error(JSON.stringify(err));
      return [errorHandler(err), null]; 
    }
  }

};
