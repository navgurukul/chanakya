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
const { campus } = require('../config');

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
  async main(){
    const data = await this.findall()
    const campusIdAndName = {}
    for (var campusObj of campus){
      campusIdAndName[campusObj.id]=campusObj.name
    }
    const roleBaseAccess = {
      // students
      specialLogin: [],
      students: {
        view: []
      },

      // campus
      campus: {
        view: []
      },

      // partners
      partners: {
        view: []
      },
    };
    for (const i of campus) {
      roleBaseAccess.campus[i.name] = {
        view:[]
      }
    }
    roleBaseAccess.campus.All = {
      view:[]
    }
    for (const user of data){
      for (const role of user.roles){
        if (role.includes('Partner')){
          roleBaseAccess.partners.view.push(user.email)
          const splited = role.split(':');
          for (var partnerId of splited[1].split(',')){
            if(roleBaseAccess.partners[partnerId]){
              roleBaseAccess.partners[partnerId].view.push(user.email);

            }else{
              roleBaseAccess.partners[partnerId]={view:[user.email]}
            }

          }
        }
        if (role.includes('T&P')){
          roleBaseAccess.campus.view.push(user.email);
          const splited = role.split(':');
          for (var campusId of splited[1].split(',')){
          roleBaseAccess.campus[campusIdAndName[campusId]].view.push(user.email);

          }
        }
      }
      for (const previlige of user.privilege){
        if(previlige==="specialLogin"){
          roleBaseAccess.specialLogin.push(user.email)
        }
      }
    }
    return roleBaseAccess
  }

}