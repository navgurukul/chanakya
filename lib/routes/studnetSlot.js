const Joi = require('joi');
const _ = require('underscore');
const CONSTANTS = require('../constants');

module.exports = [
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
          start_time: Joi.string().regex(
            /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/
          ),
          end_time_expected: Joi.string().regex(
            /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/
          ),
          duration: Joi.string().default(null),
          on_date: Joi.date(),
        }),
      },
      handler: async (request) => {
        const { studnetInterviewSlot } = request.services();
        const slot = await studnetInterviewSlot.create(request.payload);
        return slot;
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
          start_time: Joi.string().regex(
            /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/
          ),
          end_time_expected: Joi.string().regex(
            /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/
          ),
          duration: Joi.string().allow(null, ''),
          status: Joi.string().valid(..._.keys(CONSTANTS.interviewSlotStatus)),
          is_cancelled: Joi.boolean(),
          cancelltion_reason: Joi.string().default(null),
        }),
      },
      handler: async (request) => {
        const { slotId } = request.params;
        const { studnetInterviewSlot } = request.services();
        const updatedData = await studnetInterviewSlot.update(
          request.payload,
          slotId
        );
        if (updatedData === 1) {
          return {
            message: 'Successfully updated',
          };
        }
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
        const isDeleted = await studnetInterviewSlot.delete(
          request.params.slotId
        );
        if (isDeleted === 1) {
          return {
            message: 'Successfully inserted slot deleted',
          };
        }
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
        return {
          data,
        };
      },
    },
  },
  {
    method: "GET",
    path: "/slot/interview/check/ondate/{date}/{stage}",
    options: {
      description: "get all slots on the given date",
      tags: ["api"],
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
            from: "9:00",
            to: "10:00",
          },
          {
            id: 2,
            from: "10:00",
            to: "11:00",
          },
          {
            id: 3,
            from: "11:00",
            to: "12:00",
          },
          {
            id: 7,
            from: "12:00",
            to: "13:00",
          },
          {
            id: 4,
            from: "13:00",
            to: "14:00",
          },
          {
            id: 5,
            from: "14:00",
            to: "15:00",
          },
          {
            id: 6,
            from: "15:00",
            to: "16:00",
          },
        ]
        for (var i of availiblity){
          for (var j of data){
            if(i.from===j.start_time && i.to==j.end_time_expected){
              i.availiblity=false
            }
          }
          if (i.availiblity!=false){
            i.availiblity=true
          }
        }
        return {
          data:availiblity,
        };
      },
    },
  },
];
