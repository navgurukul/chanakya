'use strict';
const Schmervice = require('schmervice');
const _ = require('underscore');
const CONSTANTS = require('../constants');

const internals = {};

internals.getDateRange = function(day) {
	const endDate = new Date();
	const startDate = new Date(endDate);

	startDate.setDate(endDate.getDate() - day);

	return {
		startDate,
		endDate,
	};
};

module.exports = class MetricsService extends Schmervice.Service {
	async totalLiveRecordsOnSystem(txn = null) {
		const { studentService } = this.server.services();

		const students = await studentService.findAll();
		let totalRecords = {
			male: 0,
			female: 0,
			trans: 0,
			withoutGender: 0,
		};
		_.each(students, student => {
			if (CONSTANTS.metrics.liveStages.indexOf(student.stage) > -1) {
				switch (student.gender) {
					case CONSTANTS.studentDetails.gender.male:
						totalRecords['male'] += 1;
						return;
					case CONSTANTS.studentDetails.gender.female:
						totalRecords['female'] += 1;
						return;
					case CONSTANTS.studentDetails.gender.trans:
						totalRecords['trans'] += 1;
						return;
					default:
						totalRecords['withoutGender'] += 1;
						return;
				}
			}
		});
		return totalRecords;
	}

	async totalStaleRecordsOnSystem() {
		const { studentService } = this.server.services();
		let totalRecords = {
			male: 0,
			female: 0,
			trans: 0,
			withoutGender: 0,
		};

		let students = await studentService.findAll('transitions');
		let stageNotChangeSincePromises = [];

		_.each(students, async student => {
			if (CONSTANTS.metrics.liveStages.indexOf(student.stage) == -1) {
				return;
			}
			const stageNotChangeSince = await studentService.studentStageNotChangeSince(student);
			if (stageNotChangeSince > CONSTANTS.metrics.staleRecordThresold) {
				switch (student.gender) {
					case CONSTANTS.studentDetails.gender.male:
						totalRecords['male'] += 1;
						return;
					case CONSTANTS.studentDetails.gender.female:
						totalRecords['female'] += 1;
						return;
					case CONSTANTS.studentDetails.gender.trans:
						totalRecords['trans'] += 1;
						return;
					default:
						totalRecords['withoutGender'] += 1;
						return;
				}
			}
			stageNotChangeSincePromises.push(stageNotChangeSince);
		});

		await Promise.all(stageNotChangeSincePromises);
		return totalRecords;
	}

	async totalStudentsJoinedTillNow(txn = null) {
		const { StageTransition } = this.server.models();
		let totalRecords = {
			male: 0,
			female: 0,
			trans: 0,
			withoutGender: 0,
		};
		const whereClause = {
			'stage_transitions.toStage': 'finallyJoined',
		};

		const students = await StageTransition.query(txn)
			.joinRelation('student')
            .where(whereClause);
    
        _.each(students, student => {
            switch (student.gender) {
                case CONSTANTS.studentDetails.gender.male:
                    totalRecords['male'] += 1;
                    return;
                case CONSTANTS.studentDetails.gender.female:
                    totalRecords['female'] += 1;
                    return;
                case CONSTANTS.studentDetails.gender.trans:
                    totalRecords['trans'] += 1;
                    return;
                default:
                    totalRecords['withoutGender'] += 1;
                    return;
            }
        })
		return totalRecords;
	}

	async totalNewIncomingCalls(txn = null) {
		const { IncomingCall } = this.server.models();
		const dateRange = internals.getDateRange(1);

		const incomingCalls = await IncomingCall.query(txn)
			.where('incoming_calls.createdAt', '>', dateRange.startDate)
			.where('incoming_calls.createdAt', '<=', dateRange.endDate);
		return incomingCalls.length;
	}

	async totalNewStudentsFromPartners(txn = null) {
        const { StageTransition } = this.server.models();
        let totalRecords = {
			male: 0,
			female: 0,
			trans: 0,
			withoutGender: 0,
        };
        
		const dateRange = internals.getDateRange(1);

		const whereClause = {
			'stage_transitions.toStage': 'completedTest',
		};

		let students = await StageTransition.query(txn)
			.joinRelation('student')
			.where('stage_transitions.createdAt', '>', dateRange.startDate)
			.where('stage_transitions.createdAt', '<=', dateRange.endDate)
			.where(whereClause)
			.whereNot({ 'student.partnerId': null });
        
        _.each(students, student => {
            switch (student.gender) {
                case CONSTANTS.studentDetails.gender.male:
                    totalRecords['male'] += 1;
                    return;
                case CONSTANTS.studentDetails.gender.female:
                    totalRecords['female'] += 1;
                    return;
                case CONSTANTS.studentDetails.gender.trans:
                    totalRecords['trans'] += 1;
                    return;
                default:
                    totalRecords['withoutGender'] += 1;
                    return;
            }
        });
		return totalRecords;
	}

	async totalNewStudentsFromHelpline(txn = null) {
        const { StageTransition } = this.server.models();
        let totalRecords = {
			male: 0,
			female: 0,
			trans: 0,
			withoutGender: 0,
        };

		const dateRange = internals.getDateRange(1);

		const whereClause = {
			'student.partnerId': null,
			'stage_transitions.toStage': 'completedTest',
		};

		const students = await StageTransition.query(txn)
			.joinRelation('student')
			.where('stage_transitions.createdAt', '>', dateRange.startDate)
			.where('stage_transitions.createdAt', '<=', dateRange.endDate)
			.where(whereClause);

        _.each(students, student => {
            switch (student.gender) {
                case CONSTANTS.studentDetails.gender.male:
                    totalRecords['male'] += 1;
                    return;
                case CONSTANTS.studentDetails.gender.female:
                    totalRecords['female'] += 1;
                    return;
                case CONSTANTS.studentDetails.gender.trans:
                    totalRecords['trans'] += 1;
                    return;
                default:
                    totalRecords['withoutGender'] += 1;
                    return;
            }
        });
        return totalRecords;	
    }

	async totalNewStudentPassedTest(txn = null) {
        const { StageTransition } = this.server.models();
        let totalRecords = {
			male: 0,
			female: 0,
			trans: 0,
			withoutGender: 0,
        };

		const dateRange = internals.getDateRange(1);

		const whereClause = {
			'stage_transitions.toStage': 'testPassed',
		};

		const students = await StageTransition.query(txn)
			.joinRelation('student')
			.where('stage_transitions.createdAt', '>', dateRange.startDate)
			.where('stage_transitions.createdAt', '<=', dateRange.endDate)
			.where(whereClause);

        _.each(students, student => {
            switch (student.gender) {
                case CONSTANTS.studentDetails.gender.male:
                    totalRecords['male'] += 1;
                    return;
                case CONSTANTS.studentDetails.gender.female:
                    totalRecords['female'] += 1;
                    return;
                case CONSTANTS.studentDetails.gender.trans:
                    totalRecords['trans'] += 1;
                    return;
                default:
                    totalRecords['withoutGender'] += 1;
                    return;
            }
        });
        return totalRecords;		}

	async totalNewStudentFailedTest(txn = null) {
        const { StageTransition } = this.server.models();
        let totalRecords = {
			male: 0,
			female: 0,
			trans: 0,
			withoutGender: 0,
        };

		const dateRange = internals.getDateRange(1);

		const whereClause = {
			'stage_transitions.toStage': 'testFailed',
		};

		const students = await StageTransition.query(txn)
			.joinRelation('student')
			.where('stage_transitions.createdAt', '>', dateRange.startDate)
			.where('stage_transitions.createdAt', '<=', dateRange.endDate)
			.where(whereClause);

        _.each(students, student => {
            switch (student.gender) {
                case CONSTANTS.studentDetails.gender.male:
                    totalRecords['male'] += 1;
                    return;
                case CONSTANTS.studentDetails.gender.female:
                    totalRecords['female'] += 1;
                    return;
                case CONSTANTS.studentDetails.gender.trans:
                    totalRecords['trans'] += 1;
                    return;
                default:
                    totalRecords['withoutGender'] += 1;
                    return;
            }
        });
        return totalRecords;	
    }

	async recordMetrics() {
		return {
			totalLiveRecordsOnSystem: await this.totalLiveRecordsOnSystem(),
			totalStaleRecordsOnSystem: await this.totalStaleRecordsOnSystem(),
			totalStudentsJoinedTillNow: await this.totalStudentsJoinedTillNow(),
			totalNewIncomingCalls: await this.totalNewIncomingCalls(),
			totalNewStudentsFromPartners: await this.totalNewStudentsFromPartners(),
			totalNewStudentsFromHelpline: await this.totalNewStudentsFromHelpline(),
			totalNewStudentPassedTest: await this.totalNewStudentPassedTest(),
			totalNewStudentFailedTest: await this.totalNewStudentFailedTest(),
		};
	}
};
