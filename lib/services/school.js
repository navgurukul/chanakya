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

module.exports = class SchoolService extends Schmervice.Service {
  async school_name(student_name, id) {
    const { School, CampusSchool, StudentSchool, studentCampus } = this.server.models();
    try {
      const store = await School.query().insert({ name: student_name });
      const store1 = await StudentSchool.query().insert({ student_id: id, school_id: store.id });
      const store2 = await studentCampus.query().select('campus_id').where('id', id);
      const store3 = await CampusSchool.query().insert({ school_id: store.id, campus_id: store2[0].campus_id });
      return store;
    } catch (err) {
      return err;
    }
  }
};
