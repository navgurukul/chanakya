const Joi = require('joi');
const PartnerAssessment = require('../models/partnerAssessment');
const Partner = require('../models/partner');

module.exports = [
  {
    method: "POST",
    path: "/partners/{partnerId}/assessments",
    options: {
      description: "Create a new assessment for a partner.",
      tags: ["api"],
      validate: {
        params: Joi.object({
          partnerId: Partner.field("id"),
        }),
        payload: Joi.object({
          name: PartnerAssessment.field("name"),
        }),
      },
      handler: async (request) => {
        const { partnerService } = request.services();

        const partner = await partnerService.findById(request.params.partnerId);

        const assessment = await partnerService.createAssessment(
          partner,
          request.payload.name
        );

        return { data: assessment };
      },
    },
  },
  {
    method: "GET",
    path: "/partners/{partnerId}/assessments",
    options: {
      description: "Get all the assessments created for a particular partner.",
      tags: ["api"],
      validate: {
        params: Joi.object({
          partnerId: Partner.field("id"),
        }),
      },
      handler: async (request) => {
        const { partnerService } = request.services();

        const partner = await partnerService.findById(
          request.params.partnerId,
          "assessments"
        );

        return { data: partner.assessments };
      },
    },
  },
  {
    method: "GET",
    path: "/partners/{partnerId}/assessments/{assessmentId}/attempts",
    options: {
      description:
        "Get list of all attempts made for a given assessment of a partner.",
      tags: ["api"],
      handler: async () => ({ notImplemented: true }),
    },
  },
  {
    method: "POST",
    path: "/partners/{partnerId}/assessments/{assessmentId}/attempts",
    options: {
      description:
        "Create the attempts for a given assessment. Requires a CSV upload.",
      tags: ["api"],
      validate: {
        params: Joi.object({
          partnerId: Partner.field("id"),
          assessmentId: PartnerAssessment.field("id"),
        }),
        payload: Joi.object({
          csvUrl: Joi.string(),
        }),
      },
      handler: async (request) => {
        const { partnerService } = request.services();

        const partner = await partnerService.findById(
          request.params.partnerId,
          "assessments"
        );

        const response = await partnerService.recordAssessmentDetails(
          partner,
          request.params.assessmentId,
          request.payload.csvUrl
        );
        if (response.csvParsingError) {
          return { errors: response };
        }

        return { sucess: true, csvParsingError: false };
      },
    },
  },
];
