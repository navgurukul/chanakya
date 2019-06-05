    'use strict';
const Schmervice = require('schmervice');
const _ = require("underscore");
const CONSTANTS = require('../constants');


module.exports = class MetricsService extends Schmervice.Service { 

    async totalLiveRecordsOnSystem() {
        
    };

    async totalStaleRecordsOnSystem() {

    }

    async totalStudentsJoinedTillNow() {
        const { studentService } = this.server.services();
        const whereClause = {};
        const whereNotClause = {};
        const students = await studentService.findStudentsByStageTransition('completedTest', whereClause, whereNotClause, txn);
        return students.length;    
    }

    async totalNewIncomingCalls(txn=null) {
        const { IncomingCall } = this.server.models();
        let incomingCalls = await IncomingCall.query(txn).where({'incoming_calls.createdAt': new Date()});
        return incomingCalls.length;
    }   

    async totalNewStudentsFromPartners(txn=null) {
        const { studentService } = this.server.services();
        const whereClause = {
            'stage_transitions.createdAt': new Date(),
        };
        const whereNotClause = {
            'student.partnerId': null
        };
        const students = await studentService.findStudentsByStageTransition('completedTest', whereClause, whereNotClause, txn);
        return students.length;
    }

    async totalNewStudentsFromHelpline(txn=null) {
        const { studentService } = this.server.services();
        const whereClause = {
            'stage_transitions.createdAt': new Date(),
            'student.partnerId': null
        }
        const whereNotClause = {};
        const students = await studentService.findStudentsByStageTransition('completedTest', whereClause, whereNotClause, txn);
        return students.length;    
    }

    async totalNewStudentPassedTest(txn=null) {
        const { studentService } = this.server.services();
        const whereClause = {
            'stage_transitions.createdAt': new Date(),
        }
        const whereNotClause = {};
        const students = await studentService.findStudentsByStageTransition('testPassed', whereClause, whereNotClause, txn);
        return students.length;    
    }

    async totalNewStudentFailedTest(txn=null) {
        const { studentService } = this.server.services();
        const whereClause = {
            'stage_transitions.createdAt': new Date(),
        }
        const whereNotClause = {};
        const students = await studentService.findStudentsByStageTransition('testFailed', whereClause, whereNotClause, txn);
        return students.length;    
    }

    async recordMetrics() {
        console.log()
    }
};