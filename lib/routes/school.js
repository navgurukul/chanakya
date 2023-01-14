/* eslint-disable no-unused-vars */
const Joi = require('joi');
const Boom = require('boom');
const _ = require('lodash');
const Student = require('../models/student');
const EnrolmentKey = require('../models/enrolmentKey');
const Contact = require('../models/studentContact');
const CONSTANTS = require('../constants');
const { errorHandler } = require('../../errors/index');
const logger = require('../../server/logger');

module.exports = [
  {
    method: 'POST',
    path: '/school',
    options: {
      description: 'students school',
      tags: ['api'],
      // auth: {
      //   strategy: 'jwt',
      // },
      validate: {
        payload: Joi.object({
          name: Joi.string().required(),
          // studentId: Joi.string().required()
        }),
      },
      handler: async (request) => {
        const { schoolService } = request.services();
        // console.log(request.payload, 'routes', request.auth.credentials.id);
        try {
          const data = await schoolService.school_name(
            request.payload.name,
            request.payload.studentId
          );
          return data;
        } catch (err) {
          return err;
        }
      },
    },
  },

  {
    method: 'POST',
    path: '/school/campus_school',
    options: {
      // description: 'Get students school',
      tags: ['api'],
      // auth: {
      //   strategy: 'jwt',
      // },
      validate: {
        payload: Joi.object({
          campus_id: Joi.number().integer().required(),
          school_id: Joi.number().integer().required()
        }),
      },
      handler: async (request) => {
        const { schoolService } = request.services();
        // console.log(request.payload, 'routes', request.auth.credentials.id);
        try {
          const data = await schoolService.campus_school_post(
            request.payload.campus_id,
            request.payload.school_id
          );
          return data;
        } catch (err) {
          return err;
        }
      },
    },
  },

  //   {
  //     method: 'POST',
  //     path: '/students_school',
  //     options: {
  //       // description: 'Get students school',
  //       tags: ['api'],
  //       // auth: {
  //       //   strategy: 'jwt',
  //       // },
  //       validate: {
  //         payload: Joi.object({
  //           campus_id: Joi.number().integer().required(),
  //           school_id: Joi.number().integer().required()
  //         }),
  //       },
  //       handler: async (request) => {
  //         const { schoolService } = request.services();
  //         // console.log(request.payload, 'routes', request.auth.credentials.id);
  //         try {
  //           const data = await schoolService.students_school_post(
  //             request.payload.campus_id,
  //             request.payload.school_id
  //           );
  //           return data;
  //         } catch (err) {
  //           return err;
  //         }
  //       },
  //     },
  //   },
  {
    method: 'PUT',
    path: '/school/{id}',
    options: {
      // description: 'Get students school',
      tags: ['api'],
      // auth: {
      //   strategy: 'jwt',
      // },
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required()
        }),
        payload: Joi.object({
          name: Joi.string().required(),
        }),
      },
      handler: async (request) => {
        const { schoolService } = request.services();
        try {
          const data = await schoolService.school_name_update(
            request.payload.name,
            request.params.id
          );
          return data;
        } catch (err) {
          return err;
        }
      },
    },
  },

  {
    method: 'POST',
    path: '/school/students_school',
    options: {
      // description: 'Get students school',
      tags: ['api'],
      // auth: {
      //   strategy: 'jwt',
      // },
      validate: {
        payload: Joi.object({
          student_id: Joi.number().integer().required(),
          school_id: Joi.number().integer().required()
        }),
      },
      handler: async (request) => {
        const { schoolService } = request.services();
        // console.log(request.payload, 'routes', request.auth.credentials.id);
        try {
          const data = await schoolService.students_school_post(
            request.payload.student_id,
            request.payload.school_id,
          );
          return data;
        } catch (err) {
          return err;
        }
      },
    },
  },

  {
    method: 'PUT',
    path: '/school/students_school_post/{student_id}',
    options: {
      // description: 'Get students school',
      tags: ['api'],
      // auth: {
      //   strategy: 'jwt',
      // },
      validate: {
        params: Joi.object({
          student_id: Joi.number().integer().required()
        }),
        payload: Joi.object({
          school_id: Joi.number().integer().required()
        }),
      },
      handler: async (request) => {
        const { schoolService } = request.services();
        // console.log(request.payload, 'routes', request.auth.credentials.id);
        try {
          const data = await schoolService.students_school_update(
            request.params.student_id,
            request.payload.school_id
          );
          return data;
        } catch (err) {
          return err;
        }
      },
    },
  },

  {
    method: 'DELETE',
    path: '/school/students_school_delete/{id}',
    options: {
      // description: 'Get students school',
      tags: ['api'],
      // auth: {
      //   strategy: 'jwt',
      // },
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required()
        }),
      },
      handler: async (request) => {
        const { schoolService } = request.services();
        // console.log(request.payload, 'routes', request.auth.credentials.id);
        try {
          const data = await schoolService.students_school_delete(
            request.params.id,
          );
          return data;
        } catch (err) {
          return err;
        }
      },
    },
  },
  {
    method: 'GET',
    path: '/school/students_school/{id}',
    options: {
      // description: 'Get students school',
      tags: ['api'],
      // auth: {
      //   strategy: 'jwt',
      // },
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
      },
      handler: async (request) => {
        const { schoolService } = request.services();
        try {
          const data = await schoolService.students_school_get(
            request.params.id
          );
          return data;
        } catch (err) {
          return err;
        }
      },
    },
  },

  {
    method: 'PUT',
    path: '/school/campus_school/{id}',
    options: {
      // description: 'Get students school',
      tags: ['api'],
      // auth: {
      //   strategy: 'jwt',
      // },
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required()
        }),
        payload: Joi.object({
          campus_id: Joi.number().integer().required(),
          school_id: Joi.number().integer().required()
        }),
      },
      handler: async (request) => {
        const { schoolService } = request.services();
        // console.log(request.payload, 'routes', request.auth.credentials.id);
        try {
          const data = await schoolService.campus_school_update(
            request.params.id,
            request.payload.campus_id,
            request.payload.school_id
          );
          return data;
        } catch (err) {
          return err;
        }
      },
    },
  },

  {
    method: 'GET',
    path: '/school/campus_school/{campus_id}',
    options: {
      description: 'schools available in campuses',
      tags: ['api'],
      // auth: {
      //   strategy: 'jwt',
      // },
      validate: {
        params: Joi.object({
          campus_id: Joi.number().integer().required(),
        }),
      },
      handler: async (request) => {
        const { schoolService } = request.services();
        try {
          const data = await schoolService.schoolsAvailableInCampuses(
            request.params.campus_id
          );
          logger.info('schools details in campuses');
          return data;
        } catch (err) {
          return [errorHandler(err), null];
        }
      },
    },
  },
  {
    method: 'GET',
    path: '/school',
    options: {
      description: 'Get All school',
      tags: ['api'],
      // auth: {
      //   strategy: 'jwt',
      // },
      handler: async (request) => {
        const { schoolService } = request.services();
        try {
          const data = await schoolService.allSchoolData();
          return data;
        } catch (err) {
          return err;
        }
      },
    },
  },

  {
    method: 'GET',
    path: '/school/campus_school/{school_id}',
    options: {
      description: 'Get campuses by school',
      tags: ['api'],
      // auth: {
      //   strategy: 'jwt',
      // },
      validate: {
        params: Joi.object({
          school_id: Joi.number().integer().required(),
        }),
      },
      handler: async (request, h) => {
        const { schoolService } = request.services();
        try {
          const getdata = await schoolService.getCampusesBySchool(request.params.school_id);
          logger.info('Get campuses by school.');
          return getdata ;
        } catch (err) {
          logger.error(JSON.stringify(err))
          return { message: err.message, error: true };
        }
      }
    }
  },

  // {
  //   method: 'DELETE',
  //   path: '/school/campus_school/{id}',
  //   options: {
  //     // description: 'Get students school',
  //     tags: ['api'],
  //     // auth: {
  //     //   strategy: 'jwt',
  //     // },
  //     validate: {
  //       params: Joi.object({
  //         id: Joi.number().integer().required(),
  //         // studentId: Joi.string().required()
  //       }),
  //     },
  //     handler: async (request) => {
  //       const { schoolService } = request.services();
  //       try {
  //         const data = await schoolService.campus_school_get(
  //           request.params.id
  //         );
  //         return data;
  //       } catch (err) {
  //         return err;
  //       }
  //     },
  //   },
  // },

  {
    method: 'GET',
    path: '/school/{id}',
    options: {
      // description: 'Get students school',
      tags: ['api'],
      // auth: {
      //   strategy: 'jwt',
      // },
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
      },
      handler: async (request) => {
        const { schoolService } = request.services();
        try {
          const data = await schoolService.school_name_get(
            request.params.id
          );
          return data;
        } catch (err) {
          return err;
        }
      },
    },
  },

  {
    method: 'DELETE',
    path: '/school/{id}',
    options: {
      // description: 'Get students school',
      tags: ['api'],
      // auth: {
      //   strategy: 'jwt',
      // },
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required(),
          // studentId: Joi.string().required()
        }),
      },
      handler: async (request) => {
        const { schoolService } = request.services();
        try {
          const data = await schoolService.school_name_delete(
            request.params.id
          );
          return data;
        } catch (err) {
          return err;
        }
      },
    },
  },

  {
    method: 'DELETE',
    path: '/school/campus_school/{id}',
    options: {
      // description: 'Get students school',
      tags: ['api'],
      // auth: {
      //   strategy: 'jwt',
      // },
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required(),
        }),
      },
      handler: async (request) => {
        const { schoolService } = request.services();
        try {
          const data = await schoolService.campus_school_delete(
            request.params.id
          );
          return data;
        } catch (err) {
          return err;
        }
      },
    },
  },
];
