const Joi = require('joi');
const Boom = require('boom');
const CONSTANTS = require('../constants');

module.exports = [

  {
    method: 'POST',
    path: '/students/changeStageNew/{studentId}',
    options: {
      description: 'Change student stage and milestone by studentId',
      tags: ['api'],
      validate: {
        params: Joi.object({
          studentId: Joi.number().integer().required(),
        }),
        payload: Joi.object({
          stage: Joi.string()
            .valid(...CONSTANTS.studentStages)
            .required(),
          transition_done_by: Joi.string(),
        }),
      },
      handler: async (request) => {
        const {
          studentService,
          assessmentService,
          ownersService,
          feedbackService,
        } = request.services();
        const studentStatus = await studentService.getStudentById(
          request.params.studentId
        );
        if (studentStatus.current_owner_id) {
          request.payload.current_owner_id = null;
        }

        const changedStage = await assessmentService.newPatchStudentDetails(
          { student_id: request.params.studentId, studentStatus },
          request.payload
        );
        if (
          [
            'pendingEnglishInterview',
            'pendingAlgebraInterview',
            'pendingCultureFitInterview',
          ].includes(request.payload.stage)
        ) {
          await ownersService.autoAssignFeat(
            {
              who_assign: '-*auto assign*-',
              student_stage: request.payload.stage,
              student_id: request.params.studentId,
            },
            feedbackService,
            request.payload.stage,
            request.params.studentId
          );
        }

        if (changedStage) {
          return { data: 'Stage updated successfully' };
        }
        throw Boom.badRequest(
          'The Mobile number specified is wrong. Please check and try again.'
        );
      },
    },
  },

];
