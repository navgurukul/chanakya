const Joi = require('joi');
const logger = require('../../server/logger');

module.exports = [

  {
    method: 'GET',
    path: '/campus/AllstudentsDetails',
    options: {
      description: 'Get all students details for progress made.',
      tags: ['api'],
      handler: async (request) => {
        const { studentCampusService } = request.services();

        const students = await studentCampusService.studentDetailsFromEachCampuses(request.params.campusId);
        logger.info('Get all students details for progress made.');
        return { data: students };
      },
    },
  },
  {
    method: 'GET',
    path: '/campus/{campusId}/students/distribution',
    options: {
      description: 'Get all students details for progress made graph.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          campusId: Joi.number().integer(),
        }),
      },
      handler: async (request) => {
        const { graphService, studentCampusService } = request.services();

        const students = await graphService.graph(
          await studentCampusService.progressMade(request.params.campusId)
        );
        logger.info('Get all students details for progress made graph.');
        return { data: students };
      },
    },
  },
  {
    method: 'GET',
    path: '/campus/{campusId}/students',
    options: {
      description: 'Get all students details for progress made.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          campusId: Joi.number().integer(),
        }),
      },
      handler: async (request) => {
        const { studentCampusService } = request.services();

        const students = await studentCampusService.campus_student_details(request.params.campusId);
        logger.info('Get all students details for progress made.');
        return { data: students };
      },
    },
  },

  {
    method: 'GET',
    path: '/campus',
    options: {
      description: 'List of all campus in the system.',
      tags: ['api'],
      handler: async (request) => {
        const { campusService } = request.services();
        logger.info('List of all campus in the system.');
        return { data: await campusService.findall() };
      },
    },
  },
  {
    method: 'DELETE',
    path: '/campus/student/{student_id}',
    options: {
      description: 'Remove Campus by studentId',
      tags: ['api'],
      validate: {
        params: Joi.object({
          student_id: Joi.number().integer(),
        }),
      },
      handler: async (request) => {
        const { studentCampusService } = request.services();
        const result = await studentCampusService.removeCampusById(request.params.student_id);
        logger.info('Remove Campus by studentId');
        return { success: result.success };
      },
    },
  },
  {
    method: 'GET',
    path: '/campus/{campusId}/students/progress_made_card',
    options: {
      description: 'Get all students details for progress made card.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          campusId: Joi.number().integer(),
        }),
      },
      handler: async (request) => {
        const { studentCampusService, studentProgressService } = request.services();

        const students = await studentProgressService.student_progressMade_Cards(
          await studentCampusService.progressMade(request.params.campusId)
        );
        logger.info('Get all students details for progress made card.');
        return { data: students };
      },
    },
  },

  {
    method: 'GET',
    path: '/allcampus/students/distribution',
    options: {
      description: 'Get all students details for progress made graph from all campus.',
      tags: ['api'],
      handler: async (request) => {
        const { graphService, studentCampusService } = request.services();

        const students = await graphService.graph(
          await studentCampusService.allCampusProgressMade(request.params.campusId)
        );
        logger.info('Get all students details for progress made graph from all campus.');
        return { data: students };
      },
    },
  },
  {
    method: 'GET',
    path: '/allcampus/students',
    options: {
      description: 'Get all students details for progress made from all campus.',
      tags: ['api'],
      handler: async (request) => {
        const { studentCampusService } = request.services();

        const students = await studentCampusService.allCampusProgressMade_student_details(
          request.params.campusId
        );
        logger.info('Get all students details for progress made from all campus.');
        return { data: students };
      },
    },
  },
  {
    method: 'GET',
    path: '/allcampus/students/progress_made_card',
    options: {
      description: 'Get all students details for progress made card from all campus.',
      tags: ['api'],
      handler: async (request) => {
        const { studentCampusService, studentProgressService } = request.services();

        const students = await studentProgressService.student_progressMade_Cards(
          await studentCampusService.allCampusProgressMade(request.params.campusId)
        );
        logger.info('Get all students details for progress made card from all campus.');
        return { data: students };
      },
    },
  },
  {
    method: 'POST',
    path: '/campus',
    options: {
      description: 'create campuse with campus details',
      tags: ['api'],
      // auth:{
      //   strategy:'jwt',
      // },
      validate: {
        payload: Joi.object({
          campus: Joi.string(),
          address: Joi.string()
        })
      },
      handler: async (request) => {
        const { campusService } = request.services();
        try {
          const details = await campusService.createCampuse(request.payload)
          return details
        } catch (error) {
          logger.info(JSON.stringify(error))
          return error;
        }
      }
    }
  },
  {
    method: 'PUT',
    path: '/campus/{id}',
    options: {
      description: 'update campuse details',
      tags: ['api'],
      // auth:{
      //   strategy:'jwt',
      // },
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required()
        }),
        payload: Joi.object({
          campus: Joi.string(),
          address: Joi.string()
        })
      },
      handler: async (request) => {
        const { campusService } = request.services();
        try {
          const details = await campusService.updateCampuse(request.payload, request.params.id)
          return details;
        } catch (error) {
          logger.info(JSON.stringify(error))
          return error;
        }
      }
    }
  }
];
