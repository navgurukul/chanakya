'use strict';
const Joi = require('joi');
const CONSTANTS = require("../constants");
const _ = require('underscore');
const internals = {}
internals.generateQueryFromParams = (params) => {
    return _.map(_.keys(params), key => key + '=' + params[key]).join('&');
} 

internals.generateUrlString = (path, queryParams) => `${path}?${internals.generateQueryFromParams(queryParams)}`


module.exports = [
    {
        method: 'GET',
        path: '/students/{studentId}/request_callback',
        options: {
            description: "The student with the given ID needs to be called back.",
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    },
    {
        method: 'GET',
        path: '/students/{studentId}/send_enrolment_key',
        options: {
            description: "Sends the enrolment key to students. Creates one if doesn't exist.",
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    },
    {
        method: 'GET',
        path: '/students',
        options: {
            description: "Retreive's students details in paginated format. Also filter students based on partnerId.",
            tags: ['api'],
            validate: {
                query: {
                    pageSize: Joi.number()
                                .default(CONSTANTS.defaultValues.paginationSize),
                    pageNum: Joi.number().default(1),
                    partnerIds: Joi.string().default("")
                                .description(`"12, 34, 43" filters student for the given partnerIds`)
                }
            },
            handler: async (request, h) => {
                const { studentService } = request.services();
                const { partnerIds, pageNum, pageSize } = request.query

                let students;
                if (!partnerIds){
                    students = await studentService.findAll() 
                } else {
                    students = await studentService.findStudentsByPartnerId(partnerIds.split(","))
                }

				// Paginations
				const pageEnd = pageSize * pageNum;
				const pageStart = pageEnd - pageSize;


				const nextPageParams = {
					...request.query,
					pageNum: pageNum > (students.length / pageSize) - 1 ? null : pageNum + 1,
				};
				const prevPageParams = {
					...request.query,
					pageNum: pageNum > 1 ? pageNum - 1 : null,
				};

				const nextUrl = internals.generateUrlString(request.route.path, nextPageParams)
				const prevUrl = internals.generateUrlString(request.route.path, prevPageParams)

                return {
                    totalCount: students.length,
                    next: nextPageParams.pageNum? nextUrl: null, 
                    prev: prevPageParams.pageNum? prevUrl: null, 
                    data: students.slice(pageStart, pageEnd) 
                }
            }
        }
    }
];
