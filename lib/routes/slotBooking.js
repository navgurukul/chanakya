const Joi = require("joi");
module.exports = [
  {
    method: "POST",
    path: "/slot/owner",
    options: {
      description: "create a new owner timings.",
      tags: ["api"],
      validate: {
        payload: {
          owner_id: Joi.number().integer().greater(0),
          start_time: Joi.string(),
          end_time: Joi.string(),
          duration: Joi.string(),
          date: Joi.string(),
        },
      },
      handler: async (request) => {
        const { slotBookingService } = request.services();
        console.log("routers", slotBookingService);

        const res = await slotBookingService.create(request.payload);
        return { data: res };
      },
    },
  },
  //TODO
  //4apis
  // get api with filter of avilable and not avilable
  //filter by OwnerID
  // post multiple timings at once

  //4api

  //studnets post api
  //get
  //put
];
