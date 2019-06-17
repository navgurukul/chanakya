'use strict';
const Schmervice = require('schmervice');
const _ = require('underscore');
const CONSTANTS = require('../constants');
const moment = require("moment");

module.exports = class MetricsService extends Schmervice.Service {

	async getMetric(name, baseQuery, date) {
		let promises =[];
		let metrics = [];
	
		// add null to array of genders
		let genders = _.values(CONSTANTS.studentDetails.gender);
		genders.push(null);

		_.each(genders, (gender) => {
			promises.push( baseQuery.clone().andWhere('students.gender', gender).then((rows) => {
				metrics.push({
					metricName: name,
					gender: gender,
					value: rows[0] ? rows[0].count : 0,
					date: date
				});
			}) );
		});

		await Promise.all(promises);
		return metrics;
	}

	_liveRecordsBaseQuery(date) {
		const { StageTransition } = this.server.models();

		date = moment(date);

		let baseQuery = StageTransition.query().count('stage_transitions.id as count')
			.innerJoin('students')
			.where('stage_transitions.studentId', StageTransition.knex().raw('students.id'))
			.whereIn('toStage', CONSTANTS.liveStudentStages)
			.andWhere(StageTransition.knex().raw('DATE(stage_transitions.createdAt)'), date.format('YYYY-MM-DD'));

		return baseQuery;
		
	}

	_staleRecordsBaseQuery() {

		// it takens the snapshot of aggregate numbers at the moment it runs.
		// a past date cannot be specified

		const { Student, StageTransition } = this.server.models();

		// basic query. will build on this. will add gender based params later on.
		let subQuery = StageTransition.knex().select('studentId', StageTransition.knex().raw('MAX(createdAt) as maxCreatedAt'))
			.groupBy('studentId').from('stage_transitions').as('t1');
		let baseQuery = StageTransition.knex().count('students.id as count').from(subQuery)
			.innerJoin('stage_transitions')
			.innerJoin('students')
			.whereIn('stage', CONSTANTS.liveStudentStages)
			.andWhere('t1.maxCreatedAt', '=', StageTransition.knex().raw('stage_transitions.createdAt'))
			.andWhere('t1.studentId', '=', StageTransition.knex().raw('stage_transitions.studentId'))
			.andWhere('t1.maxCreatedAt', '<', StageTransition.knex().raw(`CURDATE() - INTERVAL ${CONSTANTS.staleRecordThreshold} day`))
			.andWhere('t1.studentId', '=', StageTransition.knex().raw('students.id'))
			.groupBy('students.gender');
		
		return baseQuery;

	}

	_newStudentsBaseQuery(date) {
		const { StageTransition } = this.server.models();

		date = moment(date);

		let baseQuery = StageTransition.knex().count('stage_transitions.id as count').innerJoin('students').from('stage_transitions')
			.where('stage_transitions.studentId', '=', StageTransition.knex().raw('students.id'))
			.andWhere('toStage', 'completedTest')
			.andWhere(StageTransition.knex().raw('DATE(stage_transitions.createdAt)'), date.format('YYYY-MM-DD'))
	
		return baseQuery;
	}

	_newPartnerStudentsBaseQuery() {
		let baseQuery = this._newStudentsBaseQuery();
		return baseQuery.clone().andWhere('typeOfTest', 'offlineTest');
	}

	_newHelplineStudentsBaseQuery() {
		let baseQuery = this._newStudentsBaseQuery();
		return baseQuery.clone().andWhere('typeOfTest', 'onlineTest');	
	}

	async stageLevelMetrics(date) {
		const { Student, StageTransition } = this.server.models();

		date = moment(date);
		let promises = [];
		let stageWiseMetrics = [];

		_.each(CONSTANTS.studentStages, (stage) => {
			let baseQuery = StageTransition.knex().count('stage_transitions.id as count').from('stage_transitions')
				.innerJoin('students')
				.where('stage_transitions.studentId', '=', StageTransition.knex().raw('students.id'))
				.andWhere('stage_transitions.toStage', stage)
				.andWhere(StageTransition.knex().raw('DATE(stage_transitions.createdAt)'), date.format('YYYY-MM-DD'))
			promises.push( this.getMetric(stage, baseQuery, date).then((metrics) => {
				stageWiseMetrics.push(metrics);
			}) );
		});

		await Promise.all(promises);

		return _.flatten(stageWiseMetrics);
	}

	async newIncomingCallMetrics(date) {
		const { IncomingCall } = this.server.models();

		date = moment(date);
		let metricName = 'newIncomingCalls'
		let metrics = [];

		let rows = await IncomingCall.query().count('id as count')
			.where('callType', 'requestCallback')
			.andWhere(IncomingCall.knex().raw('DATE(createdAt)'), date.format('YYYY-MM-DD'));
		
		metrics.push({
			metricName: metricName,
			value: rows[0] ? rows[0].count : 0,
			date: date
		});
		return metrics;
	}

	async recordAllMetrics(date) {
		let promises = [];
		let allMetrics = [];

		// live records
		let liveRecordsQuery = this._liveRecordsBaseQuery(date);
		promises.push( this.getMetric('liveRecords', liveRecordsQuery, date).then(metrics => allMetrics.push(metrics)) );

		// stale records
		let staleRecordsQuery = this._staleRecordsBaseQuery(date);
		promises.push( this.getMetric('staleRecords', staleRecordsQuery, date).then(metrics => allMetrics.push(metrics)) );

		// new students (from partners)
		let newPartnerStudentsQuery = this._newPartnerStudentsBaseQuery(date);
		promises.push( this.getMetric('newPartnerStudents', newPartnerStudentsQuery, date).then(metrics => allMetrics.push(metrics)) );

		// new students (from helpline)
		let newHelplineStudentsQuery = this._newHelplineStudentsBaseQuery(date);
		promises.push( this.getMetric('newHelplineStudents', newHelplineStudentsQuery, date).then(metrics => allMetrics.push(metrics)) );

		// stage level metrics
		promises.push( this.stageLevelMetrics(date).then(metrics => allMetrics.push(metrics)) );

		// new incoming calls
		promises.push( this.newIncomingCallMetrics(date).then(metrics => allMetrics.push(metrics)) );

		// wait for all the metrics to be fetched
		await Promise.all(promises);
		allMetrics = _.flatten(allMetrics);

		// insert the metrics into the metrics table
		const { Metrics } = this.server.models();
		_.each(allMetrics, (metric, i) => {
			allMetrics[i].date = new Date(allMetrics[i].date);
		});
		await Metrics.query().insertGraph(allMetrics);
	}

};
