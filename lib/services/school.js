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
  async school_name(name) {
    const { School } = this.server.models();
    try {
        // Capitalize the first letter of each word
        let words = name.split(' ');
        let capitalizedWords = words.map(word => {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        });
        let output = capitalizedWords.join(' ');

        // Check if the school name already exists in the database
        const existingSchool = await School.query().findOne({ name: output });

        if (existingSchool) {
            // School name already exists, return an error or handle it accordingly
            return { error: 'School name already exists' };
        } else {
            // School name does not exist, insert it into the database
            const newSchool = await School.query().insert({ name: output });
            return newSchool;
        }
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
        .select('campus_school.school_id', 'school.name', 'campus_school.capacityofschool AS capacity')
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
      const dataFetch = await StudentSchool.query().where('student_id', studentId);
      let store;
      if (dataFetch.length == 0) {
        store = await StudentSchool.query().insert({ school_id: schoolId, student_id: studentId });
      }
      else {
        store = await StudentSchool.query().update({ school_id: schoolId }).where('student_id', studentId);
      }
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

  // Update coloumn of capacityofschool in the campuse_school'
  async update_capacity_school(campus_id, school_id, capacityofschool){
    const { CampusSchool } = this.server.models();
    let updateData;
    try {

      const data = await CampusSchool.query().where('campus_id', campus_id)
        .andWhere('school_id', school_id);

      if (data.length == 0) {
        updateData = CampusSchool.query().insert({ 'campus_id': campus_id, 'school_id': school_id, 'capacityofschool': capacityofschool })
      }
      else {

        updateData = await CampusSchool.query()
          .patch({ capacityofschool: capacityofschool })
          .where('campus_id', campus_id)
          .andWhere('school_id', school_id);
      }
      return updateData
    } catch (err) {
      logger.error(JSON.stringify(err));
      return [errorHandler(err), null]; 
    }
  }

};
