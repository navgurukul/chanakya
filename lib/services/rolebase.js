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
  async getPrivilege() {
    const { Privilege } = this.server.models();
    return await Privilege.query()

  }
  async getAllRoles() {
    const { Roles } = this.server.models();
    return await Roles.query()

  }
  async createPrivilege(newPrivilege) {
    const { Privilege } = this.server.models();
    return await Privilege.query().insert(newPrivilege)
    

  }
  async createRole(newRole) {
    const { Roles } = this.server.models();
    return await Roles.query().insert(newRole)
  }
  async updateRole(id,newRole) {
    const { Roles } = this.server.models();
    return await Roles.query().insert(newRole).where('id',id)

  }
  async updatePrivilege(id,newPrivilege) {
    const { Privilege } = this.server.models();
    return await Privilege.query().update(newPrivilege).where('id',id)

  }
  async insertUserRole(newUserRole) {
    const { UserRole } = this.server.models();
    return await UserRole.query().insert(newUserRole)
    
  }
  
  async deleteUserRole(id) {
    const { UserRole,Access } = this.server.models();
    await Access.query().delete().where('user_role_id',id)
    return await UserRole.query().delete().where('id',id)
  }
  async addAccess(newAccess) {
    const { Access } = this.server.models();
    return await Access.query().insert(newAccess)

  }
  async deleteUserAccess(id) {
    const { Access } = this.server.models();
    return await Access.query().delete().where('id',id)

  }
  async addUserEmail(newUserEmail) {
    const { UserEmail } = this.server.models();
    return await UserEmail.query().insert(newUserEmail)
  }
  async deleteUserEmail(id) {
    const { UserEmail,UserRole,Access } = this.server.models();
    const roles = await UserRole.query().where('chanakya_user_email_id',id)
    for (var i of roles){
      await Access.query().delete().where('user_role_id',i.id)
      await UserRole.query().delete().where('id',i.id)
    }
    return await UserEmail.query().delete().where('id',id)
  }

  async addUser(User) {
    console.log(User)
    const { UserRole } = this.server.models();
    const { id } = await UserRole.query().insert(User);
    return id
    // console.log(UserRole,"userroles")
    // if (User.roles) {
    //   User.roles = val(User.roles).asArray().castTo("text[]");
    // }
    
    // if (User.privilege) {
    //     User.privilege = val(User.privilege).asArray().castTo("text[]");
    // }
    // // const id = 1
    // console.log(User)
    // const { id } = await Rolebase.query().insert(User);
    // return await Rolebase.query().where({ id });

  }
  async updateUser(User, id) {
    const { UserRole } = this.server.models();

    await UserRole.query().update(User).where("id", id);
    return await UserRole.query().where("id", id);
  }
  async findall(query) {
    const { UserRole,UserEmail } = this.server.models();

    return await UserEmail.query()
    .withGraphFetched({userrole:{"access":true,"role":true,"privileges":true}})
    .modifyGraph("access", (builder) => {
      builder.select("access");
    })
    .modifyGraph("role", (builder) => {
      builder.select("roles");
    });
  }
  async findById(emailId) {
    const { UserRole,UserEmail } = this.server.models();

    return await UserEmail.query().where("email", emailId)
    .withGraphFetched({userrole:{"access":true,"role":true,"privileges":true}});
  }
  async delete(id) {
    const { UserRole, Access } = this.server.models();
    await Access.query().delete().where("user_role_id",id);
    return await UserRole.query().delete().where("id", id);
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