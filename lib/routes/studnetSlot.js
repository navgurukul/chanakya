const CONSTANTS = require("../constants");
const Joi = require("joi");
const _ = require("underscore");
module.exports = [
  {
    method: "POST",
    path: "/slot/interview/student",
    options: {
      description: "creating a slot for the students interview",
      tags: ["api"],
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
    method: "PUT",
    path: "/slot/interview/student/{slotId}",
    options: {
      description: "Upadte the owner schedule",
      tags: ["api"],
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
          duration: Joi.string().allow(null, ""),
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
        if (updatedData == 1) {
          return {
            message: "Successfully updated",
          };
        } else {
          return {
            message: "Updation failed please try again",
          };
        }
      },
    },
  },
  {
    method: "DELETE",
    path: "/slot/interview/stundet/{slotId}",
    options: {
      description: "Delete the slot",
      tags: ["api"],
      validate: {
        params: Joi.object({
          slotId: Joi.number().integer(),
        }),
      },
      handler: async (request) => {
        console.log("Slot id", request.params.slotId);
        const { studnetInterviewSlot } = request.services();
        const isDeleted = await studnetInterviewSlot.delete(
          request.params.slotId
        );
        if (isDeleted == 1) {
          return {
            message: "Successfully inserted slot deleted",
          };
        } else {
          return {
            message: "Something went wrong please try again!",
          };
        }
      },
    },
  },
  {
    method: "GET",
    path: "/slot/scheduled",
    options: {
      description: "get all scheduled slots",
      tags: ["api"],
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
    method: "GET",
    path: "/slot/interview/student/{slotId}",
    options: {
      description: "get slot details with the given ID.",
      tags: ["api"],
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
    method: "GET",
    path: "/slot/interview/{studentId}",
    options: {
      description: "get all slots with the specified studentID.",
      tags: ["api"],
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
    method: "GET",
    path: "/slot/interview/ondate/{date}",
    options: {
      description: "get all slots on the given date",
      tags: ["api"],
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
];
//TODO
/**
 * get All the avilavle slots 
 * [
 *  {
    *  from:8,
*   to :9,
 *  ownersCount:0,
 *  bookedSlots:0,  
 *  }
 * ]
 */