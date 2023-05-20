const Joi = require('joi');
const Partner = require('../models/partner');
const logger = require('../../server/logger');

module.exports = [
  {
    method: 'GET',
    path: '/partners',
    options: {
      description: 'List of all partners in the system.',
      tags: ['api'],
      handler: async (request) => {
        const { partnerService } = request.services();

        const partners = await partnerService.findAll();
        logger.info('List of all partners in the system.');
        return { data: partners };
      },
    },
  },

  {
    method: 'POST',
    path: '/partners',
    options: {
      description: 'Create a new partner.',
      tags: ['api'],
      // auth: {
      // strategy: 'jwt',
      // },
      validate: {
        payload: Joi.object({
          name: Partner.field('name').required(),
          notes: Partner.field('notes'),
          slug: Partner.field('slug').required(),
          email: Partner.field('email'),
          partner_user: Joi.array(),
          districts: Partner.field('districts'),
          state: Partner.field('state'),
          meraki_link: Partner.field('meraki_link'),
        }),
      },
      handler: async (request) => {
        const { partnerService } = request.services();
        const partnerDetails = { ...request.payload };
        if (request.auth.isAuthenticated) {
          partnerDetails.referred_by = request.auth.credentials.email;
        }
        const partnerUser = partnerDetails.partner_user;

        delete partnerDetails.partner_user;
        const partner = await partnerService.create(partnerDetails);
        // console.log(partner,"partner");
        // console.log(partner,"partner");
        await partnerService.insertPartnerUser(partner.id, partnerUser);
        logger.info('Create a new partner.');
        return { data: partner };
      },
    },
  },
  {
    method: 'PUT',
    path: '/partners/{partnerId}/merakiLink',
    options: {
      description: 'Get partner details with the given ID.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          partnerId: Partner.field('id'),
        }),
        headers: Joi.object({
          platform: Joi.string().valid('web', 'android'),
        }),
        options: { allowUnknown: true },
      },
      handler: async (request) => {
        const { partnerService } = request.services();
        const partner = await partnerService.partnerSpecificLink(
          request.headers.platform,
          request.params.partnerId
        );
        logger.info('Get partner details with the given ID.');
        return { data: partner };
      },
    },
  },
  {
    method: 'GET',
    path: '/partners/{partnerId}',
    options: {
      description: 'Get partner details with the given ID.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          partnerId: Partner.field('id'),
        }),
      },
      handler: async (request) => {
        const { partnerService } = request.services();
        const partner = await partnerService.findById(request.params.partnerId);
        logger.info('Get partner details with the given ID.');
        return { data: partner };
      },
    },
  },
  {
    method: 'PUT',
    path: '/partners/{partnerId}',
    options: {
      description: 'Edit partner details with the given ID.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          partnerId: Partner.field('id'),
        }),
        payload: Joi.object({
          name: Partner.field('name'),
          notes: Partner.field('notes'),
          slug: Partner.field('slug'),
          email: Partner.field('email'),
          partner_user: Joi.array(),
          districts: Partner.field('districts'),
          state: Partner.field('state'),
          meraki_link: Partner.field('meraki_link'),
          description: Partner.field('description'),
          logo: Partner.field('logo'),
          website_link: Partner.field('website_link'),
        }),
      },
      handler: async (request) => {
        const { partnerService } = request.services();
        const partner = await partnerService.findById(request.params.partnerId);
        const partnerDetails = { ...request.payload };
        for (const key in partnerDetails) {
          if (partnerDetails[key] === null || partnerDetails[key] === '') {
            partnerDetails[key] = partner[key];
          }
        }

        const partnerUser = partnerDetails.partner_user;
        await partnerService.updatePartnerUser(partnerUser);
        delete partnerDetails.partner_user;

        await partnerService.update(request.params.partnerId, {
          ...partner,
          ...partnerDetails,
        });
        const partnerNew = await partnerService.findById(request.params.partnerId)
        logger.info('Edit partner details with the given ID.');
        return { data: partnerNew };
      },
    },
  },
  {
    method: 'GET',
    path: '/partners/{partnerId}/students',
    options: {
      description: 'Get all the students of a given partner',
      tags: ['api'],
      validate: {
        params: Joi.object({
          partnerId: Partner.field('id'),
        }),
        query: Joi.object({
          from: Joi.date(),
          to: Joi.date(),
        }),
      },
      handler: async (request) => {
        const { studentService, partnerService } = request.services();
        const fromDate = request.query.from;
        const toDate = request.query.to;

        const partner = await partnerService.findById(request.params.partnerId);
        const students = await studentService.findAllByPartner(partner.id, fromDate, toDate);
        logger.info('Get all the students of a given partner');
        return { data: students };
      },
    },
  },
  {
    method: 'GET',
    path: '/partners/{partnerId}/students/distribution',
    options: {
      description: 'Get all the students of a given partner graph distribution',
      tags: ['api'],
      validate: {
        params: Joi.object({
          partnerId: Partner.field('id'),
        }),
        query: Joi.object({
          from: Joi.date(),
          to: Joi.date(),
        }),
      },
      handler: async (request) => {
        const { studentService, partnerService, graphService } = request.services();
        const fromDate = request.query.from;
        const toDate = request.query.to;
        const partner = await partnerService.findById(request.params.partnerId);
        const s = await studentService.addStudentDetails(
          // filter students who has not yet joined campus
          // filter by finallyJoined stage
          await studentService.filterByJoinedCampus(
            await studentService.findAllByPartner(partner.id, fromDate, toDate)
          )
        );
        const students = await graphService.graph(s);
        logger.info('Get all the students of a given partner graph distribution');
        return { data: students };
      },
    },
  },
  {
    method: 'GET',
    path: '/partners/slug/{slug}',
    options: {
      description: 'Get partners details by slug',
      tags: ['api'],
      validate: {
        params: Joi.object({
          slug: Joi.string().required(),
        }),
      },
      handler: async (request) => {
        const { partnerService } = request.services();

        const [error, partner] = await partnerService.findBySlug(request.params.slug);
        if (error){
          logger.error(JSON.stringify(error));
          return {msg: error.message,code:error.code}
        }
        if (partner.length ===0){
          return {msg: "partner not found"}
        } 
        logger.info('Get partners details by slug');
        return { data: partner };
      },
    },
  },
  {
    method: 'GET',
    path: '/partners/studentId/{studentId}',
    options: {
      description: 'Get partners details by slug',
      tags: ['api'],
      validate: {
        params: Joi.object({
          studentId: Joi.string().required(),
        }),
      },
      handler: async (request) => {
        const { partnerService } = request.services();

        const partner = await partnerService.findByStudentId(request.params.studentId);
        logger.info('Get partners details by slug');
        return { data: partner };
      },
    },
  },
  {
    method: 'GET',
    path: '/partners/enrolmentKey/{enrolmentKey}',
    options: {
      description: 'Get partners details by enrolment key of student',
      tags: ['api'],
      validate: {
        params: Joi.object({
          enrolmentKey: Joi.string().required(),
        }),
      },
      handler: async (request) => {
        const { partnerService } = request.services();

        const [partner] = await partnerService.findByEnrolmentKey(request.params.enrolmentKey);
        logger.info('Get partners details by enrolment key of student');
        return { data: partner };
      },
    },
  },
  {
    method: 'GET',
    path: '/partners/graph/progress_made/{partnerId}',
    options: {
      description: 'Get graph data  students details for progress made.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          partnerId: Partner.field('id'),
        }),
      },
      handler: async (request) => {
        const { partnerService } = request.services();
        const res = await partnerService.getProgressMadeForGraph(request.params.partnerId);
        logger.info('Get graph data  students details for progress made.');
        return res;
      },
    },
  },
  {
    method: 'GET',
    path: '/partners/progress_made/{partnerId}',
    options: {
      description: 'Get all partner students details for progress made.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          partnerId: Partner.field('id'),
        }),
      },
      handler: async (request) => {
        const { partnerService } = request.services();

        const partner = await partnerService.progressMade(request.params.partnerId);
        logger.info('Get all partner students details for progress made.');
        return { data: partner };
      },
    },
  },
  {
    method: 'GET',
    path: '/partners/joined_progress_made/{partnerId}',
    options: {
      description: 'Get all partner students details who joined campus for progress made.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          partnerId: Partner.field('id'),
        }),
      },
      handler: async (request) => {
        const { partnerService } = request.services();

        const partner = await partnerService.student_progressMade(request.params.partnerId);
        logger.info('Get all partner students details who joined campus for progress made.');
        return { data: partner };
      },
    },
  },
  {
    method: 'GET',
    path: '/partners/{partnerId}/students/progress_made_card',
    options: {
      description: 'Get all partner students details for progress made card.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          partnerId: Partner.field('id'),
        }),
      },
      handler: async (request) => {
        const { partnerService, studentProgressService } = request.services();

        const partner = await studentProgressService.student_progressMade_Cards(
          await partnerService.student_progressMade(request.params.partnerId)
        );
        logger.info('Get all partner students details for progress made card.');
        return { data: partner };
      },
    },
  },
  {
    method: 'GET',
    path: '/partnerGroup/joined_progress_made/{partnerGroupId}',
    options: {
      description: 'Get all partner group students details who joined campus for progress made.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          partnerGroupId: Joi.number().integer(),
        }),
      },
      handler: async (request) => {
        const { partnerService } = request.services();
        // const partner = []
        const partner = await partnerService.student_progressMadeParterGroup(
          request.params.partnerGroupId
        );
        logger.info('Get all partner group students details who joined campus for progress made.');
        return { data: partner };
      },
    },
  },

  {
    method: 'GET',
    path: '/partnerGroup/{partnerGroupId}/students/progress_made_card',
    options: {
      description: 'Get all partner students details for progress made card.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          partnerGroupId: Partner.field('id'),
        }),
      },
      handler: async (request) => {
        const { partnerService, studentProgressService } = request.services();

        const partner = await studentProgressService.student_progressMade_Cards(
          await partnerService.student_progressMadeParterGroup(request.params.partnerGroupId)
        );
        logger.info('Get all partner students details for progress made card.');
        return { data: partner };
      },
    },
  },
  {
    method: 'GET',
    path: '/partnerGroup/{partnerGroupId}/students/distribution',
    options: {
      description: 'Get all the students of a given partnerGroup graph distribution',
      tags: ['api'],
      validate: {
        params: Joi.object({
          partnerGroupId: Partner.field('id'),
        }),
        query: Joi.object({
          from: Joi.date(),
          to: Joi.date(),
        }),
      },
      handler: async (request) => {
        const { studentService, partnerService, graphService } = request.services();
        const fromDate = request.query.from;
        const toDate = request.query.to;
        const patnerIdsOfGroup = await partnerService.PartnerIdsFromPartnerGroupId(
          request.params.partnerGroupId
        );
        var result = [];
        for (var partner of patnerIdsOfGroup) {
          // const partner = await partnerService.findById(partners.partnerId);
          const s = await studentService.addStudentDetails(
            // filter students who has not yet joined campus
            // filter by finallyJoined stage
            await studentService.filterByJoinedCampus(
              await studentService.findAllByPartner(partner.partner_id, fromDate, toDate)
            )
          );
          result = [...s, ...result];
        }
        var students = await graphService.graph(result);

        logger.info('Get all the students of a given partnerGroup graph distribution');
        return { data: students };
      },
    },
  },
  {
    method: 'GET',
    path: '/partnerGroup/graph/progress_made/{partnerGroupId}',
    options: {
      description: 'Get graph data  students details for progress made.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          partnerGroupId: Partner.field('id'),
        }),
      },
      handler: async (request) => {
        const { partnerService } = request.services();
        const result = await partnerService.getStudentsForPartnerGroup(
          request.params.partnerGroupId
        );
        logger.info('Get graph data  students details for progress made.');
        return result;
      },
    },
  },
  {
    method: 'GET',
    path: '/partnerGroup/progress_made/{partnerGroupId}',
    options: {
      description: 'Get all partner group students details for progress made.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          partnerGroupId: Partner.field('id'),
        }),
      },
      handler: async (request) => {
        const { partnerService } = request.services();

        const partner = await partnerService.progressMadeForParterGroup(
          request.params.partnerGroupId
        );
        logger.info('Get all partner group students details for progress made.');
        return { data: partner };
      },
    },
  },
  {
    method: 'GET',
    path: '/partnerGroup/{partnerGroupId}/students',
    options: {
      description: 'Get all the students of a given partner group',
      tags: ['api'],
      validate: {
        params: Joi.object({
          partnerGroupId: Partner.field('id'),
        }),
        query: Joi.object({
          from: Joi.date(),
          to: Joi.date(),
        }),
      },
      handler: async (request) => {
        const { studentService, partnerService } = request.services();
        const fromDate = request.query.from;
        const toDate = request.query.to;
        const patnerIdsOfGroup = await partnerService.PartnerIdsFromPartnerGroupId(
          request.params.partnerGroupId
        );

        // const partner = await partnerService.findById(request.params.partnerId);
        var result = [];

        for (var partner of patnerIdsOfGroup) {
          const students = await studentService.findAllByPartner(
            partner.partner_id,
            fromDate,
            toDate
          );
          result = [...result, ...students];
        }

        logger.info('Get all the students of a given partner group');
        return { data: result };
      },
    },
  },
  {
    method: 'GET',
    path: '/partnerGroup/{partnerGroupId}/name',
    options: {
      description: 'Get partner group name',
      tags: ['api'],
      validate: {
        params: Joi.object({
          partnerGroupId: Partner.field('id'),
        }),
      },
      handler: async (request) => {
        const { partnerService } = request.services();

        const patnerIdsOfGroup = await partnerService.getNameForPartnerGroup(
          request.params.partnerGroupId
        );

        logger.info('Get partner group name');
        return { data: patnerIdsOfGroup };
      },
    },
  },
];
