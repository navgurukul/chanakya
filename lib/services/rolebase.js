/* eslint-disable no-return-await */
/* eslint-disable guard-for-in */
/* eslint-disable no-shadow */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-unused-vars */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable camelcase */
/* eslint-disable no-await-in-loop */
const Schmervice = require("schmervice");
const Joi = require("joi");
const _ = require("lodash");
const { val } = require("objection");

module.exports = class RolebaseService extends Schmervice.Service {
  async addUser(User) {
    const { Rolebase } = this.server.models();
    if (User.roles) {
      User.roles = val(User.roles).asArray().castTo("text[]");
    }
    
    if (User.privilege) {
        User.privilege = val(User.privilege).asArray().castTo("text[]");
    }
    // const id = 1
    console.log(User)
    const { id } = await Rolebase.query().insert(User);
    return await Rolebase.query().where({ id });
  }
  async updateUser(User, id) {
    const { Rolebase } = this.server.models();

    if (User.roles) {
        User.roles = val(User.roles).asArray().castTo("text[]");
      }
      
      if (User.privilege) {
          User.privilege = val(User.privilege).asArray().castTo("text[]");
      }
    await Rolebase.query().update(User).where("id", id);
    return await Rolebase.query().where("id", id);
  }
  async findall(query) {
    const { Rolebase } = this.server.models();

    return await Rolebase.query();
  }
  async delete(id) {
    const { Rolebase } = this.server.models();
    console.log(id)
    return await Rolebase.query().delete().where("id", id);
  }

}