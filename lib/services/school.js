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
const axios = require("axios");
const https = require("https");

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

  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  // test.....................Ghar...........................
  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

  async fetchUserId(email, ip_address, wstoken) {
    // core_user_get_users function to get the user details like id, name, etc
    const url = `http://${ip_address}/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=core_user_get_users&moodlewsrestformat=json&criteria[0][key]=email&criteria[0][value]=${email}`;
    const userData = await axios.get(url);
    if (userData.data.users.length === 0) return { error: "User not found" };
    const userId = userData.data.users[0].id;
    return userId;
  }

  async categoryAndCoursesTest(emails, checkProdOrDev) {
    try {
      console.log(emails, checkProdOrDev,'>>>>>>>>>>>>>')
      let wstoken='657d1e478afe4b4285252a7f351f0d8d';
      let ip_address = '52.86.230.241';
      const usersData = [];
  
      // Dynamic batch size based on email count
      const baseBatchSize = 15; // Adjust this base value
      const maxBatchSize = 100; // Adjust this maximum value
  
      const batchSize = Math.min(maxBatchSize, Math.max(baseBatchSize, Math.ceil(emails.length / 5))); // Dynamic calculation
  
      for (let i = 0; i < emails.length; i += batchSize) {
        const emailBatch = emails.slice(i, i + batchSize);
  
        const batchResults = await Promise.all(emailBatch.map(async (email) => {
          const userEmail = email;
          const userDataCategoryAndCourses = {};
          if (!userEmail) {
            throw new Error("Missing email parameter");
          }
          
          // if (checkProdOrDev == true) {
          //   wstoken = config.Moodle.token;
          //   ip_address = config.Moodle.ip_address;
          // } else {
          //   wstoken = config.Moodle.tokenDev;
          //   ip_address = config.Moodle.ip_addressDev;
          // }
          
  
          const userId = await this.fetchUserId(email, ip_address, wstoken);
  
          const urlGetEnrolledCourses = `http://${ip_address}/webservice/rest/server.php?wstoken=657d1e478afe4b4285252a7f351f0d8d&wsfunction=core_enrol_get_users_courses&moodlewsrestformat=json&userid=${userId}`;
  
          const categoryUrl = `http://${ip_address}/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=core_course_get_categories&moodlewsrestformat=json`;
  
          const gradeOverviewByCoursesUrl = `http://${ip_address}/webservice/rest/server.php?wstoken=${wstoken}&wsfunction=gradereport_overview_get_course_grades&moodlewsrestformat=json&userid=${userId}`;
  
          const [enrolledCourses, categories, gradeOverviewByCourses] = await Promise.all([
            axios.get(urlGetEnrolledCourses),
            axios.get(categoryUrl),
            axios.get(gradeOverviewByCoursesUrl)
          ]);
  
          const courseGrades = {};
          gradeOverviewByCourses.data.grades.forEach((grade) => {
            courseGrades[grade.courseid] = {
              grade: grade.grade,
              rawgrade: grade.rawgrade,
              rank: grade.rank,
            };
          });
  
          categories.data.forEach((cat) => {
            const categoryName = cat.name.toLowerCase();
            const coursesInCategory = enrolledCourses.data.filter(
              (c) => c.category === cat.id
            );
            if (coursesInCategory.length > 0) {
              userDataCategoryAndCourses[userEmail] = {
                ...userDataCategoryAndCourses[userEmail], // Retain existing data for the email
                [categoryName]: coursesInCategory.map((course) => {
                  return { ...course, grade: courseGrades[course.id] };
                }),
              };
            }
          });
  
          return userDataCategoryAndCourses;
        }));
  
        usersData.push(...batchResults);
      }
  
      return usersData;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to fetch Moodle user data");
    }
  }



};
