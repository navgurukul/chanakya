    'use strict';
const Schmervice = require('schmervice');
const _ = require("underscore");
const CONSTANTS = require('../constants');

const internals = {}

internals.getDateRange = function (day) {
    const endDate = new Date();
    const startDate = new Date(endDate);
    
    startDate.setDate(endDate.getDate() - day);

    return {
        startDate,
        endDate
    }
}
module.exports = class MetricsService extends Schmervice.Service { 

    async totalLiveRecordsOnSystem(txn=null) {
        const { studentService } = this.server.services();
        const whereClause = {
            'stage_transitions.toStage': CONSTANTS.liveStages,
        }
        const whereNotClause ={}
        const students = await studentService.findStudentsByStageTransition(CONSTANTS.liveStages, whereClause, whereNotClause, txn);
        return students.length
    };

    async totalStaleRecordsOnSystem() {
        const { studentService } = this.server.services();
        const student = {};
        const students = await studentService.studentStageNotChangeSince(student);
        
        if (students > 7) {
            return students
        };

    }

    async totalStudentsJoinedTillNow(txn=null) {

        const { StageTransition } = this.server.models();
        const dateRange = internals.getDateRange(1);

        const whereClause = {
            'stage_transitions.toStage': "finallyJoined"
        };

        const students = await StageTransition.query(txn).joinRelation('student').where(whereClause)

        _.each(students, student => console.log(student.studentId))
        return students.length;  
    }

    async totalNewIncomingCalls(txn=null) {
        const { IncomingCall } = this.server.models();
        const incomingCalls = await IncomingCall.query(txn).where({'incoming_calls.createdAt': new Date()})
        return incomingCalls.length;
    }   

    async totalNewStudentsFromPartners(txn=null) {
        const { StageTransition } = this.server.models();
        const dateRange = internals.getDateRange(1);

        const whereClause = {
            'stage_transitions.toStage': "completedTest"
        };

        let students = await StageTransition.query(txn).joinRelation('student')
                    .where('stage_transitions.createdAt', '>', dateRange.startDate)
                    .where('stage_transitions.createdAt', '<=', dateRange.endDate)
                    .where(whereClause)
                    .whereNot({'student.partnerId': null})

        _.each(students, student => console.log(student.studentId))
        return students.length;
    }

    async totalNewStudentsFromHelpline(txn=null) {
        const { StageTransition } = this.server.models();
        const dateRange = internals.getDateRange(1);

        const whereClause = {
            'student.partnerId': null,
            'stage_transitions.toStage': "completedTest"
        };

        const students = await StageTransition.query(txn).joinRelation('student')
                    .where('stage_transitions.createdAt', '>', dateRange.startDate)
                    .where('stage_transitions.createdAt', '<=', dateRange.endDate)
                    .where(whereClause)

        _.each(students, student => console.log(student.studentId))
        return students.length;    
    }

    async totalNewStudentPassedTest(txn=null) {

        const { StageTransition } = this.server.models();
        const dateRange = internals.getDateRange(1);

        const whereClause = {
            'stage_transitions.toStage': "testPassed"
        };

        const students = await StageTransition.query(txn).joinRelation('student')
                    .where('stage_transitions.createdAt', '>', dateRange.startDate)
                    .where('stage_transitions.createdAt', '<=', dateRange.endDate)
                    .where(whereClause)

        _.each(students, student => console.log(student.studentId))
        return students.length;  
    }

    async totalNewStudentFailedTest(txn=null) {

        const { StageTransition } = this.server.models();
        const dateRange = internals.getDateRange(1);

        const whereClause = {
            'stage_transitions.toStage': "testFailed"
        };

        const students = await StageTransition.query(txn).joinRelation('student')
                    .where('stage_transitions.createdAt', '>', dateRange.startDate)
                    .where('stage_transitions.createdAt', '<=', dateRange.endDate)
                    .where(whereClause)

        _.each(students, student => console.log(student.studentId))
        return students.length;   
    }

    async recordMetrics() {
        console.log(await this.totalStudentsJoinedTillNow(),  'totalStudentsJoinedTillNow')
        console.log(await this.totalNewIncomingCalls(), 'totalNewIncomingCalls')
        console.log(await this.totalNewStudentsFromPartners(),  'totalNewStudentsFromPartners')
        console.log(await this.totalNewStudentsFromHelpline(),  'totalNewStudentsFromHelpline')
        console.log(await this.totalNewStudentPassedTest(),  'totalNewStudentPassedTest')
        console.log(await this.totalNewStudentFailedTest(),  'totalNewStudentFailedTest')
    }
};