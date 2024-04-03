const Joi = require('joi');
const logger = require('../../server/logger');

module.exports = [
    {
        method: 'POST',
        path: '/stage/{stage_id}/subStage',
        options: {
          description: 'Add sub-stages to the perticular stage',
          tags: ['api'],
          validate: {
            params: Joi.object({
              stage_id: Joi.number().integer().required(),
            }),
            payload: Joi.object({
              school_id: Joi.number().required(),
              stage_name: Joi.string().required(),
              sub_stages: Joi.array().required(),
            //   sub_stages_id: Joi.array().items(Joi.number()).required(),
            }),
          },
          handler: async (request) => {
            const { stageServices } = request.services();
            // console.log('stageServices', stageServices);
            try {
              console.log(request.payload);
              const subStageList = await stageServices.add_sub_stage(request.payload, request.params.stage_id);
              logger.info('add stages in school');
              return subStageList;
            } catch (error) {
                console.log('Error aa raha hai')
              return error;
            }
          },
        },
      },
    {
        method: 'POST',
        path: '/stage',
        options: {
            description: 'add stages',
            tags: ['api'],
            // auth:{
            //     strategy:'jwt'
            // },
            validate: {
                payload: Joi.object({
                    school_id: Joi.number(),
                    stageName: Joi.string(),
                    stageType: Joi.string(),
                })
            },
            handler: async (request) => {
                const { stageServices } = request.services();
                try {
                    console.log(request.payload)
                    const stageData = await stageServices.add_stage(
                        request.payload
                    )
                    logger.info('add stages in school')
                    return stageData;
                } catch (error) {
                    return error;
                }
            },
        },
    },
    {
        method: 'GET',
        path: '/stage/{school_id}',
        options: {
            description: "Get all stage",
            tags: ['api'],
            // auth:{
            //     strategy:'jwt'
            // },
            validate: {
                params: Joi.object({
                    school_id: Joi.number().integer().required(),
                }),
            },
            handler: async (request) => {
                const { stageServices } = request.services();
                try {
                    const getStage = await stageServices.getStagesBySchoolID(request.params.school_id);
                    console.log('getStage', getStage)
                    logger.info('get all school stages')
                    return getStage;
                } catch (error) {
                    return error;
                }
            },
        },
    },

    {
        method: 'PUT',
        path: '/stage/update/{id}',
        options: {
            description: 'update stage',
            tags: ['api'],
            // auth:{
            //     strategy:'jwt',
            // }
            validate: {
                params: Joi.object({
                    id: Joi.number().integer().required(),
                }),
                payload: Joi.object({
                    stageName: Joi.string().optional(),
                    stageType: Joi.string().optional(),
                })
            },
            handler: async (request) => {
                const { stageServices } = request.services();
                try {
                    const data = await stageServices.updateStage(request.payload, request.params.id);
                    logger.info('update stage')
                    return data;
                } catch (error) {
                    return error;
                }
            },
        },
    },

    {
        method: 'DELETE',
        path: '/stage/{id}',
        options: {
            tags: ['api'],
            // auth:{
            //     strategy:'jwt'
            // }
            validate: {
                params: Joi.object({
                    id: Joi.number().integer().required(),
                }),
            },
            handler: async (request) => {
                const { stageServices } = request.services();
                try {
                    const data = await stageServices.deleteStage(
                        request.params.id
                    );
                    return data
                } catch (error) {
                    return error;
                }
            },
        },
    },


];