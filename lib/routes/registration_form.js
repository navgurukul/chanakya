const CONSTANTS = require("../constants");
const Joi = require("joi");
module.exports = [
  {
    method: "GET",
    path: "/registration_form/{partnerId}/structure",
    options: {
      description: "Get API to get the form structure of a specific partner id",
      tags: ["api"],
      validate: {
        params: {
          partnerId: Joi.number().integer(),
        },
      },
      handler: async (request) => {
        const { registrationFormService } = request.services();

        const students = await registrationFormService.findStructureByPartnerId(
          request.params.partnerId
        );
        return { data: students };
      },
    },
  },
  {
    method: "POST",
    path: "/registration_form/{partnerId}/structure",
    options: {
      description: "API to create form structure through partner id",
      tags: ["api"],
      validate: {
        params: {
          partnerId: Joi.number().integer(),
        },

        payload: {
          formStructure: Joi.object(),
        },
      },
      handler: async (request) => {
        const { registrationFormService } = request.services();
        console.log(request.payload);
        const students =
          await registrationFormService.createFormStructureForAPartner(
            request.params.partnerId,
            request.payload.formStructure
          );
        return { data: students };
      },
    },
  },
  {
    method: "PUT",
    path: "/registration_form/{partnerId}/structure",
    options: {
      description: "API to edit form structure through partner id",
      tags: ["api"],
      validate: {
        params: {
          partnerId: Joi.number().integer(),
        },
        payload: {
          formStructure: Joi.object(),
        },
      },
      handler: async (request) => {
        const { registrationFormService } = request.services();
        console.log(request.payload);
        const students =
          await registrationFormService.updateFormStructureForAPartner(
            request.params.partnerId,
            request.payload.formStructure
          );
        return { data: students };
      },
    },
  },
  {
    method: "DELETE",
    path: "/registration_form/{partnerId}/structure",
    options: {
      description: "API to delete form structure through partner id",
      tags: ["api"],
      validate: {
        params: {
          partnerId: Joi.number().integer(),
        },
      },
      handler: async (request) => {
        const { registrationFormService } = request.services();
        console.log(request.payload);
        await registrationFormService.deleteFormStructureForAPartner(
          request.params.partnerId
        );
        return { data: "deleted successfully" };
      },
    },
  },
  {
    method: "GET",
    path: "/registration_form/{partnerId}/data",
    options: {
      description: "Get API to get the form structure of a specific partner id",
      tags: ["api"],
      validate: {
        params: {
          partnerId: Joi.number().integer(),
        },
      },
      handler: async (request) => {
        const { registrationFormService } = request.services();

        const students =
          await registrationFormService.findRegisteredDataByPartnerId(
            request.params.partnerId
          );
        return { data: students };
      },
    },
  },
  {
    method: "POST",
    path: "/registration_form/{partnerId}/data",
    options: {
      description: "API to create form structure through partner id",
      tags: ["api"],
      validate: {
        params: {
          partnerId: Joi.number().integer(),
        },

        payload: {
          formData: Joi.object(),
        },
      },
      handler: async (request) => {
        const { registrationFormService } = request.services();
        console.log(request.payload);
        const students =
          await registrationFormService.registerAStudentForAPartner(
            request.params.partnerId,
            request.payload.formData
          );
        return { data: students };
      },
    },
  },
];
