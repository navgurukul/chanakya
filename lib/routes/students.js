'use strict';
const Joi = require('joi');
const CONSTANTS = require("../constants");
const _ = require('underscore');
const Student = require("../models/student");

const internals = {}
internals.generateQueryFromParams = (params) => {
    return _.map(_.keys(params), key => key + '=' + params[key]).join('&');
} 

internals.generateUrlString = (path, queryParams) => {
    return queryParams.pageNum? `${path}?${internals.generateQueryFromParams(queryParams)}`: null
}


module.exports = [
    {
        method: 'GET',
        path: '/students/{studentId}/request_callback',
        options: {
            description: "The student with the given ID needs to be called back.",
            tags: ['api'],
            handler: async (request, h) => {
                return {notImplemented: true}
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
                return {notImplemented: true}
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
                                .description(`"12, 34, 43" filters student for the given partnerIds`),
                    excludeColumns: Joi.array().items(Joi.string().valid(Student.fields())).single()
                                .description("Column that you want to exclude.")
                }
            },
            handler: async (request, h) => {
                const { studentService } = request.services();
                const { partnerIds, pageNum, pageSize, excludeColumns } = request.query
                let students;
                if (!partnerIds){
                    students = await studentService.findAll() 
                } else {
                    students = await studentService.findStudentsByPartnerId(partnerIds.split(","))
                }
                
                const totalCount = students.length;

				// Paginations
				const pageEnd = pageSize * pageNum;
				const pageStart = pageEnd - pageSize;


				const nextPageParams = {
					...request.query,
					pageNum: pageNum > (totalCount / pageSize) ? null : pageNum + 1,
				};
				const prevPageParams = {
					...request.query,
					pageNum: pageNum > 1 ? pageNum - 1 : null,
				};

				const nextUrl = internals.generateUrlString(request.route.path, nextPageParams)
                const prevUrl = internals.generateUrlString(request.route.path, prevPageParams)

                students = students.slice(pageStart, pageEnd)

                // columns to exclude
                if (excludeColumns) {
                    _.each(students, student => {
                        _.each(excludeColumns, columns => delete student[columns])
                    })
                }

                return {
                    totalCount,
                    next: nextUrl, 
                    prev: prevUrl, 
                    data: students
                }
            }
        }
    }
];
