const Joi = require('joi');
const moment = require('moment');

module.exports = [
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
        query: Joi.object({
          from: Joi.date(),
          to: Joi.date(),
        }),
      },
      handler: async (request) => {
        const { studentCampusService } = request.services();
        const fromDate = request.query.from;
        const toDate = request.query.to;
        // const startDate = moment(request.query.startDate, 'YYYY-MM-DD');
        // const endDate = moment(request.query.endDate, 'YYYY-MM-DD');
        const students = await studentCampusService.findAllStudentsByCampusId(
          request.params.campusId,
          fromDate,
          toDate
        );
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
        return { data: await campusService.findall() };
      },
    },
  },
  {
    method: 'DELETE',
    path: '/campus/student/{student_id}',
    options: {
      description: '.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          student_id: Joi.number().integer(),
        }),
      },
      handler: async (request) => {
        const { studentCampusService } = request.services();
        const result = await studentCampusService.removeCampusById(request.params.student_id);
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
        return { data: students };
      },
    },
  },
];
