'use strict';
const Schmervice = require('schmervice');
const _ = require('underscore');
const CONSTANTS = require('../constants');
const moment = require("moment");

module.exports = class MetricsService extends Schmervice.Service {

	async getMetricFromBaseQuery(name, baseQuery, date) {
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
			promises.push( this.getMetricFromBaseQuery(stage, baseQuery, date).then((metrics) => {
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

	async recordAllMetrics(date, recordNonDate=false) {
		let promises = [];
		let allMetrics = [];

		// live records
		let liveRecordsQuery = this._liveRecordsBaseQuery(date);
		promises.push( this.getMetricFromBaseQuery('liveRecords', liveRecordsQuery, date).then(metrics => allMetrics.push(metrics)) );

		// new students (from partners)o
		let newPartnerStudentsQuery = this._newPartnerStudentsBaseQuery(date);
		promises.push( this.getMetricFromBaseQuery('newPartnerStudents', newPartnerStudentsQuery, date).then(metrics => allMetrics.push(metrics)) );

		// new students (from helpline)
		let newHelplineStudentsQuery = this._newHelplineStudentsBaseQuery(date);
		promises.push( this.getMetricFromBaseQuery('newHelplineStudents', newHelplineStudentsQuery, date).then(metrics => allMetrics.push(metrics)) );

		// stage level metrics
		promises.push( this.stageLevelMetrics(date).then(metrics => allMetrics.push(metrics)) );

		// new incoming calls
		promises.push( this.newIncomingCallMetrics(date).then(metrics => allMetrics.push(metrics)) );

		// some metrics like stale record numbers are calculated in a way where their value at the current moment of time
		// is calculated. so there is no way currently to get the number of stale records on a particular day.
		// until `recordNonDate` is true such metrics are not recorded in the DB.
		if (recordNonDate) {
			// stale records
			let staleRecordsQuery = this._staleRecordsBaseQuery();
			promises.push( this.getMetricFromBaseQuery('staleRecords', staleRecordsQuery, date).then(metrics => allMetrics.push(metrics)) );
		}

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

	async recordPendingMetrics() {
		const { Metrics } = this.server.models();

		// check the last day for which the metrics are recorded
		let lasRecDate = await Metrics.query().max('date as maxDate').groupBy('date').orderBy('date', 'desc').limit(1);
		lasRecDate = lasRecDate.length > 0 ? moment(lasRecDate[0].maxDate) : null;

		// if last day of metric recording is yesterday (less than 1 day from today) do nothing
		// this is done as all the metrics are recorded at a date level and we will only get accurate metrics for the past day
		let today = moment();
		let yest = today.subtract(1, 'days');
		let datesToRecord = [];
		if (lasRecDate == null) {
			// entering here means there are no metrics in the table
			let metricCalcStartDate = moment(CONSTANTS.metricCalculationStartDate);
			let diff = yest.diff(metricCalcStartDate, 'days');
			_.each(_.range(diff+1), (el, i) => {
				datesToRecord.push( metricCalcStartDate.clone().add(i, 'days') );
			})
		}
		else if ( (lasRecDate.isSame(yest, 'year') && lasRecDate.isSame(yest, 'month') && lasRecDate.isSame(yest, 'day')) != true ) {
			// calculate the dates between `last day of metric recording` and yesterday
			let diff = yest.diff(lasRecDate, 'days');
			_.each(_.range(diff), (el, i) => {
				datesToRecord.push( lasRecDate.clone().add(i+1, 'days') );
			});
		} else {
			// last recorded day is same as yesterday
			// we don't need to do anything
			return;
		}

		let promises = [];

		// call `recordAllMetrics` for all those dates
		_.each(datesToRecord, (date, i) => {
			// make sure `recordNonDate` is true only for yesterday
			if (datesToRecord.length-1 == i) {
				promises.push( this.recordAllMetrics(date, true) );
			} else {
				promises.push( this.recordAllMetrics(date, false) );
			}
		});
		return await Promise.all(promises);

	}

};
