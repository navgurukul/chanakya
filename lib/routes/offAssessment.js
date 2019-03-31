'use strict';
const Joi = require('joi');
const PartnerAssessment = require('../models/partnerAssessment');
const Partner = require('../models/partner');

module.exports = [
    {
        method: 'POST',
        path: '/partners/{partnerId}/assessments',
        options: {
            description: "Create a new assessment for a partner.",
            tags: ['api'],
            validate: {
                params: {
                    partnerId: Partner.field("id")
                },
                payload: {
                    name: PartnerAssessment.field("name")
                }
            },
            handler: async (request, h) => {
                const { partnerService } = request.services();

                let partner = await partnerService.findById(request.params.partnerId);

                let assessment = await partnerService.createAssessment(partner, request.payload.name);

                return { data: assessment }
            }
        }
    },
    {
        method: 'GET',
        path: '/partners/{partnerId}/assessments',
        options: {
            description: "Get all the assessments created for a particular partner.",
            tags: ['api'],
            validate: {
                params: {
                    partnerId: Partner.field("id")
                }
            },
            handler: async (request, h) => {
                const { partnerService } = request.services();

                let partner = await partnerService.findById(request.params.partnerId, 'assessments');

                return { data: partner.assessments };
            }
        }
    },
    {
        method: 'GET',
        path: '/partners/{partnerId}/assessments/{assessmentId}/attempts',
        options: {
            description: "Get list of all attempts made for a given assessment of a partner.",
            tags: ['api'],
            handler: async (request, h) => {
                return {notImplemented: true}
            }
        }
    },
    {
        method: 'POST',
        path: '/partners/{partnerId}/assessments/{assessmentId}/attempts',
        options: {
            description: "Create the attempts for a given assessment. Requires a CSV upload.",
            tags: ['api'],
            validate: {
                params: {
                    partnerId: Partner.field("id"),
                    assessmentId: PartnerAssessment.field("id"),
                },
                payload: {
                    csvUrl: Joi.string()
                }
            },
            handler: async (request, h) => {
                const { partnerService } =  request.services();

                let partner = await partnerService.findById(request.params.partnerId, 'assessments');

                let response = await partnerService.recordAssessmentDetails(partner, request.params.assessmentId, request.payload.csvUrl);
                if (response.csvParsingError) {
                    return { errors: response }
                }

                return { sucess: true, csvParsingError: false }
            }
        }
    }
];
