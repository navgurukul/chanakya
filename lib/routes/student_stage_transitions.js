const Joi = require('joi');
const logger = require('../../server/logger');

module.exports = [

    {
        method: 'POST',
        path: '/stages/students/transitions',
        options: {
            description: 'add stages by id',
            tags: ['api'],
            // auth:{
            //     strategy:'jwt'
            // },
            validate: {
                payload:Joi.object({
                    student_id:Joi.number().integer().required(),
                    stage_id: Joi.number().integer().required(),
                })                
            },
            handler: async (request) => {
                const { stageTransitionsService } = request.services();
                try {
                    // console.log(request.payload.stage_id,"hewwww")
                    const stageStudent = await stageTransitionsService.updateAndPostStagesInStudentsById(
                        request.payload.student_id,
                        request.payload.stage_id,
                    )
                    // logger.info('add stages in school')
                    // console.log(stageStudent,"hii")
                    return stageStudent;
                } catch (error) {
                    return error;
                }
            },
        },
    },

    
]