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

internals.countTotalRecordsGenderWise = function(students) {
	let totalRecords = {
		male: 0,
		female: 0,
		trans: 0,
		withoutGender: 0,
	};

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
		const whereClause = {
			'stage_transitions.toStage': 'finallyJoined',
		};

		const students = await StageTransition.query(txn)
			.joinRelation('student')
			.where(whereClause);

		return internals.countTotalRecordsGenderWise(students);
	}

	async totalNewIncomingCalls(day, txn = null) {
		const { IncomingCall } = this.server.models();
		const dateRange = internals.getDateRange(day);

		const incomingCalls = await IncomingCall.query(txn)
			.where('incoming_calls.createdAt', '>', dateRange.startDate)
			.where('incoming_calls.createdAt', '<=', dateRange.endDate);
		return incomingCalls.length;
	}

	async totalNewStudentsFromPartners(day, txn = null) {
		const { StageTransition } = this.server.models();
		const dateRange = internals.getDateRange(day);

		const whereClause = {
			'stage_transitions.toStage': 'completedTest',
		};

		let students = await StageTransition.query(txn)
			.joinRelation('student')
			.where('stage_transitions.createdAt', '>', dateRange.startDate)
			.where('stage_transitions.createdAt', '<=', dateRange.endDate)
			.where(whereClause)
			.whereNot({ 'student.partnerId': null });

		return internals.countTotalRecordsGenderWise(students);
	}

	async totalNewStudentsFromHelpline(day, txn = null) {
		const { StageTransition } = this.server.models();
		const dateRange = internals.getDateRange(day);

		const whereClause = {
			'student.partnerId': null,
			'stage_transitions.toStage': 'completedTest',
		};

		const students = await StageTransition.query(txn)
			.joinRelation('student')
			.where('stage_transitions.createdAt', '>', dateRange.startDate)
			.where('stage_transitions.createdAt', '<=', dateRange.endDate)
			.where(whereClause);

		return internals.countTotalRecordsGenderWise(students);
	}

	async totalNewStudentPassedTest(day, txn = null) {
		const { StageTransition } = this.server.models();
		const dateRange = internals.getDateRange(day);

		const whereClause = {
			'stage_transitions.toStage': 'testPassed',
		};

		const students = await StageTransition.query(txn)
			.joinRelation('student')
			.where('stage_transitions.createdAt', '>', dateRange.startDate)
			.where('stage_transitions.createdAt', '<=', dateRange.endDate)
			.where(whereClause);

		return internals.countTotalRecordsGenderWise(students);
	}

	async totalNewStudentFailedTest(day, txn = null) {
		const { StageTransition } = this.server.models();
		const dateRange = internals.getDateRange(day);

		const whereClause = {
			'stage_transitions.toStage': 'testFailed',
		};  

		const students = await StageTransition.query(txn)
			.joinRelation('student')
			.where('stage_transitions.createdAt', '>', dateRange.startDate)
			.where('stage_transitions.createdAt', '<=', dateRange.endDate)
            .where(whereClause);
            
        return internals.countTotalRecordsGenderWise(students);
	}
	async getMetrics(days) {
		return {
			totalLiveRecordsOnSystem: await this.totalLiveRecordsOnSystem(),
			totalStaleRecordsOnSystem: await this.totalStaleRecordsOnSystem(),
			totalStudentsJoinedTillNow: await this.totalStudentsJoinedTillNow(),
			totalNewIncomingCalls: await this.totalNewIncomingCalls(days),
			totalNewStudentsFromPartners: await this.totalNewStudentsFromPartners(days),
			totalNewStudentsFromHelpline: await this.totalNewStudentsFromHelpline(days),
			totalNewStudentPassedTest: await this.totalNewStudentPassedTest(days),
			totalNewStudentFailedTest: await this.totalNewStudentFailedTest(days),
		}
	}
	async recordMetrics(txn=null) {
        const { Metrics } = this.server.models();
		let metrics =  await this.getMetrics();

        let metricPromises = []
        _.each(_.keys(metrics), async key => {
            const metric = metrics[key];
            if (typeof metric == 'object') {
                _.each(_.keys(metric), async gender => {
                    let data = {
                        metricName: key,
                        value: metric[gender]
                    }
                    
                    data.gender = gender == "withoutGender"? null: CONSTANTS.studentDetails.gender[gender]
                    
                    const metricPromise = await Metrics.query(txn).insert(data)
                    metricPromises.push(metricPromise)
                })
            } else {
                let data = {
                    metricName: key,
                    value: metric,
                }
                const metricPromise = await Metrics.query(txn).insert(data)
                metricPromises.push(metricPromise)

            }
        })
        await Promise.all(metricPromises)
        return metrics;
	}
};
