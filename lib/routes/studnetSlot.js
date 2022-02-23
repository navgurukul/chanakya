const CONSTANTS = require("../constants");
const Joi = require("joi");
module.exports = [
  {
    method: "POST",
    path: "/slot/interview/stundet",
    options: {
      description: "creating a slot for the students interview",
      tags: ["api"],
      validate: {
        payload: {
          student_id: Joi.number().integer().greater(0),
          student_name: Joi.string(),
          transition_id: Joi.number().integer().greater(0),
          start_time: Joi.string().regex(
            /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/
          ),
          end_time_expected: Joi.string().regex(
            /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/
          ),
          duration: Joi.string().default(null),
          on_date: Joi.date(),
        },
      },
      handler: async (request) => {
        console.log("route::::::::::::::::::::::::::::");
        const { studnetInterviewSlot } = request.services();
        const slot = await studnetInterviewSlot.create(request.payload);
        return slot;
      },
    },
  },
];
