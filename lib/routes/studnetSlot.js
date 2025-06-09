const Joi = require('joi');
const _ = require('underscore');
const CONSTANTS = require('../constants');
const logger = require('../../server/logger');

module.exports = [

  // //From DEV SERVER DO NOT DELETE
  // {
  //   method: 'POST',
  //   path: '/slot/interview/student',
  //   options: {
  //     description: 'creating a slot for the students interview',
  //     tags: ['api'],
  //     validate: {
  //       payload: Joi.object({
  //         student_id: Joi.number().integer().greater(0),
  //         student_name: Joi.string(),
  //         transition_id: Joi.number().integer().greater(0),
  //         topic_name: Joi.string(),
  //         start_time: Joi.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/),
  //         end_time_expected: Joi.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/),
  //         duration: Joi.string().default(null),
  //         on_date: Joi.date(),
  //         meet_link: Joi.string().default(null),
  //       }),
  //     },
  //     handler: async (request) => {
  //       const { studnetInterviewSlot } = request.services();
  //       const slot = await studnetInterviewSlot.create(request.payload);
  //       logger.info('creating a slot for the students interview');
  //       return slot;
  //     },
  //   },
  // },
  // {
  //   method: 'PUT',
  //   path: '/slot/interview/updateMeetStatus/{slotId}',
  //   options: {
  //     description: 'Update the owner schedule',
  //     tags: ['api'],
  //     validate: {
  //       params: Joi.object({
  //         slotId: Joi.number().integer(),
  //       }),
  //       payload: Joi.object({
  //         meet_link_status: Joi.boolean().default(null),
  //       }),
  //     },
  //     handler: async (request) => {
  //       const { slotId } = request.params;
  //       const { studnetInterviewSlot } = request.services();
  //       const updatedData = await studnetInterviewSlot.update({ meet_link_status: request.payload.meet_link_status }, slotId);
  //       if (updatedData === 1) {
  //         logger.info('Updated meet link status');
  //         return {
  //           message: 'Successfully updated',
  //         };
  //       }
  //       logger.info('Updated meet link status');
  //       return {
  //         message: 'Updation failed please try again',
  //       };
  //     },
  //   },
  // },

  // New Logic
  {
    method: 'POST',
    path: '/slot/interview/student',
    options: {
      description: 'creating a slot for the students interview',
      tags: ['api'],
      validate: {
        payload: Joi.object({
          student_id: Joi.number().integer().greater(0),
          student_name: Joi.string(),
          transition_id: Joi.number().integer().greater(0),
          topic_name: Joi.string(),
          start_time: Joi.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/),
          end_time_expected: Joi.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/),
          duration: Joi.string().default(null),
          on_date: Joi.date(),
          meet_link: Joi.string().default(null),
        }),
      },
      handler: async (request) => {
        const { assessmentService, studentService, studnetInterviewSlot } = request.services();
        const slot = await studnetInterviewSlot.create(request.payload);

        // Fetch the student details using the studentId from the slot data
        const studentStatus = await studentService.getStudentById(request.payload.student_id);
        const [student] = studentStatus;

        const updateStatus = await assessmentService.patchStudentDetails(
          { student_id: request.payload.student_id, student },
          { stage: "interviewScheduled" }
        );
        logger.info('creating a slot for the students interview');
        return slot;
      },
    },
  },
  {
    method: 'PUT',
    path: '/slot/interview/updateMeetStatus/{slotId}',
    options: {
      description: 'Updated meet link status',
      tags: ['api'],
      validate: {
        params: Joi.object({
          slotId: Joi.number().integer(),
        }),
        payload: Joi.object({
          meet_link_status: Joi.boolean().default(null),
          pass: Joi.boolean().allow(null),
        }),
      },
      handler: async (request) => {
        const { studentService, assessmentService } = request.services();
        const { slotId } = request.params;
        const { studnetInterviewSlot } = request.services();

        // Fetch the slot by ID
        const data = await studnetInterviewSlot.getSlotById(slotId);

        // Fetch the student details using the studentId from the slot data
        const studentStatus = await studentService.getStudentById(data[0].student_id);
        const [student] = studentStatus;

        // Update meet status in the slot
        const updatedData = await studnetInterviewSlot.update({
          meet_link_status: request.payload.meet_link_status, result_status: !!request.payload.pass
        }, slotId);

        // If the update was successful, update the student details
        let stage;
        if (request.payload.meet_link_status == true && request.payload.pass == true) {
          stage = 'interviewPassed';
        } else if (request.payload.meet_link_status == false) {
          stage = 'studentAbsentForInterview';
        } else {
          stage = 'interviewFailed';
        }
        const updateStatus = await assessmentService.patchStudentDetails(
          { student_id: data[0].student_id, student },
          { stage: stage }
        );

        if (updatedData == 1) {
          logger.info('Updated meet link status');
          return {
            message: 'Successfully updated',
          };
        }
        logger.info('Updated meet link status');
        return {
          message: 'Updation failed please try again',
        };
      },
    },
  },

  {
    method: 'PUT',
    path: '/slot/interview/student/{slotId}',
    options: {
      description: 'Upadte the owner schedule',
      tags: ['api'],
      validate: {
        params: Joi.object({
          slotId: Joi.number().integer(),
        }),
        payload: Joi.object({
          student_id: Joi.number().integer().greater(0),
          student_name: Joi.string(),
          transition_id: Joi.number().integer().greater(0),
          start_time: Joi.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/),
          end_time_expected: Joi.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/),
          duration: Joi.string().allow(null, ''),
          status: Joi.string().valid(..._.keys(CONSTANTS.interviewSlotStatus)),
          is_cancelled: Joi.boolean(),
          cancelltion_reason: Joi.string().default(null),
        }),
      },
      handler: async (request) => {
        const { slotId } = request.params;
        const { studnetInterviewSlot } = request.services();
        const updatedData = await studnetInterviewSlot.update(request.payload, slotId);
        if (updatedData === 1) {
          logger.info('Upadte the owner schedule');
          return {
            message: 'Successfully updated',
          };
        }
        logger.info('Upadte the owner schedule');
        return {
          message: 'Updation failed please try again',
        };
      },
    },
  },
  {
    method: 'DELETE',
    path: '/slot/interview/stundet/{slotId}',
    options: {
      description: 'Delete the slot',
      tags: ['api'],
      validate: {
        params: Joi.object({
          slotId: Joi.number().integer(),
        }),
      },
      handler: async (request) => {
        const { studnetInterviewSlot } = request.services();
        const isDeleted = await studnetInterviewSlot.delete(request.params.slotId);
        if (isDeleted === 1) {
          logger.info('Delete the slot');
          return {
            message: 'Successfully inserted slot deleted',
          };
        }
        logger.info('Delete the slot');
        return {
          message: 'Something went wrong please try again!',
        };
      },
    },
  },
  {
    method: 'GET',
    path: '/slot/scheduled',
    options: {
      description: 'get all scheduled slots',
      tags: ['api'],
      handler: async (request) => {
        const { studnetInterviewSlot } = request.services();
        const data = await studnetInterviewSlot.getAllSlots();
        logger.info('get all scheduled slots');
        return {
          data,
        };
      },
    },
  },
  {
    method: 'GET',
    path: '/slot/interview/student/{slotId}',
    options: {
      description: 'get slot details with the given ID.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          slotId: Joi.number().integer(),
        }),
      },
      handler: async (request) => {
        const { slotId } = request.params;
        const { studnetInterviewSlot } = request.services();
        const data = await studnetInterviewSlot.getSlotById(slotId);
        logger.info('get slot details with the given ID.');
        return {
          data,
        };
      },
    },
  },
  {
    method: 'GET',
    path: '/slot/interview/{studentId}',
    options: {
      description: 'get all slots with the specified studentID.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          studentId: Joi.number().integer(),
        }),
      },
      handler: async (request) => {
        const { studentId } = request.params;
        const { studnetInterviewSlot } = request.services();
        const data = await studnetInterviewSlot.getAllByStudentId(studentId);
        logger.info('get all slots with the specified studentID.');
        return {
          data,
        };
      },
    },
  },
  {
    method: 'GET',
    path: '/slot/interview/ondate/{date}',
    options: {
      description: 'get all slots on the given date',
      tags: ['api'],
      validate: {
        params: Joi.object({
          date: Joi.date(),
        }),
      },
      handler: async (request) => {
        const { date } = request.params;
        const { studnetInterviewSlot } = request.services();
        const data = await studnetInterviewSlot.getAllSlotsByDate(date);
        logger.info('get all slots on the given date');
        return {
          data,
        };
      },
    },
  },
  {
    method: 'GET',
    path: '/slot/interview/check/ondate/{date}/{stage}',
    options: {
      description: 'get all slots on the given date',
      tags: ['api'],
      validate: {
        params: Joi.object({
          date: Joi.date(),
          stage: Joi.string(),
        }),
      },
      handler: async (request) => {
        const { date } = request.params;
        const { studnetInterviewSlot } = request.services();
        const data = await studnetInterviewSlot.getAllSlotsByDate(date);
        const availiblity = [
          {
            id: 1,
            from: '9:00',
            to: '10:00',
          },
          {
            id: 2,
            from: '10:00',
            to: '11:00',
          },
          {
            id: 3,
            from: '11:00',
            to: '12:00',
          },
          {
            id: 7,
            from: '12:00',
            to: '13:00',
          },
          {
            id: 4,
            from: '13:00',
            to: '14:00',
          },
          {
            id: 5,
            from: '14:00',
            to: '15:00',
          },
          {
            id: 6,
            from: '15:00',
            to: '16:00',
          },
        ];
        for (var i of availiblity) {
          for (var j of data) {
            if (i.from === j.start_time && i.to == j.end_time_expected) {
              i.availiblity = false;
            }
          }
          if (i.availiblity != false) {
            i.availiblity = true;
          }
        }
        logger.info('get all slots on the given date');
        return {
          data: availiblity,
        };
      },
    },
  },
];
