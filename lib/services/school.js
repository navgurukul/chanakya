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
const logger = require('../../server/logger');

module.exports = class SchoolService extends Schmervice.Service {
  async school_name(student_name, id) {
    const { School, CampusSchool, StudentSchool, studentCampus } = this.server.models();
    try {
      const store = await School.query().insert({ name: student_name });
      return store;
    } catch (err) {
      logger.info(JSON.stringify(err))
      return err;
    }
  }

  async school_name_get(id) {
    const { School, CampusSchool, StudentSchool, studentCampus } = this.server.models();
    try {
      const store = await School.query().where('id', id);
      return store;
    } catch (err) {
      logger.info(JSON.stringify(err))
      return err;
    }
  }

  async school_name_update(name, id) {
    const { School, CampusSchool, StudentSchool, studentCampus } = this.server.models();
    try {
      const store = await School.query().update({ name }).where('id', id);
      return store;
    } catch (err) {
      logger.info(JSON.stringify(err))
      return err;
    }
  }

  async school_name_delete(id) {
    const { School, CampusSchool, StudentSchool, studentCampus } = this.server.models();
    try {
      const store = await School.query().deleteById(id);
      return store;
    } catch (err) {
      logger.info(JSON.stringify(err))
      return err;
    }
  }

  async campus_school_post(campus_id, school_id) {
    const { CampusSchool } = this.server.models();
    try {
      const store = await CampusSchool.query().insert({ campus_id, school_id });
      return store;
    } catch (err) {
      logger.info(JSON.stringify(err))
      return err;
    }
  }

  async campus_school_get(id) {
    const { CampusSchool } = this.server.models();
    try {
      const store = await CampusSchool.query().where('id', id);
      return store;
    } catch (err) {
      logger.info(JSON.stringify(err))
      return err;
    }
  }

  async campus_school_delete(id) {
    const { CampusSchool } = this.server.models();
    try {
      const store = await CampusSchool.query().deleteById(id);
      return store;
    } catch (err) {
      logger.info(JSON.stringify(err))
      return err;
    }
  }

  async campus_school_update(id, campus_id, school_id) {
    const { CampusSchool } = this.server.models();
    try {
      const store = await CampusSchool.query().update({ campus_id, school_id }).where('id', id);
      return store;
    } catch (err) {
      logger.info(JSON.stringify(err))
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
      logger.info(JSON.stringify(err))
      return err;
    }
  }

  async students_school_get(id) {
    const { StudentSchool } = this.server.models();
    try {
      const store = await StudentSchool.query().where('id', id);
      return store;
    } catch (err) {
      logger.info(JSON.stringify(err))
      return err;
    }
  }

  async students_school_delete(id) {
    const { StudentSchool } = this.server.models();
    try {
      const store = await StudentSchool.query().deleteById(id);
      return store;
    } catch (err) {
      logger.info(JSON.stringify(err))
      return err;
    }
  }

  async students_school_update(id, student_id, school_id) {
    const { StudentSchool } = this.server.models();
    try {
      const store = await StudentSchool.query().update({ school_id, student_id }).where('id', id);
      return store;
    } catch (err) {
      logger.info(JSON.stringify(err))
      return err;
    }
  }
};
