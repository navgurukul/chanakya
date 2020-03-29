
const Schmervice = require('schmervice');
const _ = require('underscore');
const moment = require('moment');
const { raw: knexRaw } = require('objection');
const CONSTANTS = require('../constants');


module.exports = class MetricsService extends Schmervice.Service {
  async getStageTransitionMetrics(fromStage, toStage, startDate, endDate) {
    const { StageTransition } = this.server.models();

    let transitions = await StageTransition.query().select('*')
      .whereIn('studentId', StageTransition.query().distinct('studentId').where('toStage', toStage))
      .andWhere(function () {
        this.where('toStage', toStage).orWhere('toStage', fromStage);
      })
      .andWhere(function () {
        this.where(knexRaw(`IF(toStage='${toStage}', 'finalRow', 'startRow')`), 'startRow')
          .orWhere(function () {
            this.where(knexRaw(`IF(toStage='${toStage}', 'finalRow', 'startRow')`), 'finalRow')
              .andWhere(function () {
                this.where('createdAt', '>', startDate.format('YYYY-MM-DD')).andWhere('createdAt', '<', endDate.format('YYYY-MM-DD'));
              });
          });
      });

    // massage the data properly
    transitions = _.groupBy(transitions, 'studentId');
    transitions = _.map(_.keys(transitions), (tr) => {
      if (transitions[tr].length < 2) {
        return null;
      }
      const trans = transitions[tr];
      // get the record where toStage is the end stage of this query & date is min
      // get the record where toStage is start stage of this query & date is max
      let fromStageRecord = _.where(trans, { toStage: fromStage });
      let toStageRecord = _.where(trans, { toStage: toStage });
      if (fromStageRecord.length < 1 || toStageRecord.length < 1) {
        return null;
      }

      fromStageRecord = _.min(fromStageRecord, (r) => r.createdAt);
      toStageRecord = _.max(toStageRecord, (r) => r.createdAt);

      return {
        studentId: trans[0].studentId,
        transitionTime: moment(toStageRecord.createdAt).diff(moment(fromStageRecord.createdAt), 'hours'),
        records: [fromStageRecord, toStageRecord],
      };
    });
    transitions = _.filter(transitions);
    const transitionTimes = _.map(transitions, (t) => t.transitionTime);
    const transTimesLen = transitionTimes.length;
    const transTimesHalfLen = Math.floor(transTimesLen / 2);
    const median = transTimesLen % 2 === 0 ? (transitionTimes[transTimesHalfLen]) : (
      (transitionTimes[transTimesHalfLen - 1] + transitionTimes[transTimesHalfLen]) / 2.0
    );
    return {
      metrics: {
        average: (_.reduce(transitionTimes, (a, b) => a + b, 0)) / transitionTimes.length,
        median,
      },
      transitions,
    };
  }

  async getMetricFromBaseQuery(name, baseQuery, date) {
    const promises = [];
    const metrics = [];

    // add null to array of genders
    const genders = _.values(CONSTANTS.studentDetails.gender);
    genders.push(null);

    _.each(genders, (gender) => {
      promises.push(baseQuery.clone().andWhere('students.gender', gender).then((rows) => {
        metrics.push({
          metricName: name,
          gender,
          value: rows[0] ? rows[0].count : 0,
          date,
        });
      }));
    });

    await Promise.all(promises);
    return metrics;
  }

  liveRecordsBaseQuery() {
    const { Student } = this.server.models();

    const baseQuery = Student.query().count('id as count')
      .whereIn('stage', CONSTANTS.liveStudentStages);

    return baseQuery;
  }

  staleRecordsBaseQuery() {
    // it takens the snapshot of aggregate numbers at the moment it runs.
    // a past date cannot be specified

    const { StageTransition } = this.server.models();

    // basic query. will build on this. will add gender based params later on.
    const subQuery = StageTransition.knex().select('studentId', StageTransition.knex().raw('MAX(createdAt) as maxCreatedAt'))
      .groupBy('studentId').from('stage_transitions')
      .as('t1');
    const baseQuery = StageTransition.knex().count('students.id as count').from(subQuery)
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

  newStudentsBaseQuery(dates) {
    const { StageTransition } = this.server.models();

    const date = moment(dates);

    // changed innerJoin student table to enrolment_key table beacuse our typeOfTest
    // column is in enrolment_key table.
    const baseQuery = StageTransition.knex().count('stage_transitions.id as count').innerJoin('enrolment_keys').from('stage_transitions')
      .where('stage_transitions.studentId', '=', StageTransition.knex().raw('enrolment_keys.studentId'))
      .andWhere('toStage', 'completedTestWithDetails')
      .andWhere(StageTransition.knex().raw('DATE(stage_transitions.createdAt)'), date.format('YYYY-MM-DD'));

    return baseQuery;
  }

  newPartnerStudentsBaseQuery(date) {
    const { StageTransition } = this.server.models();

    const baseQuery = this.newStudentsBaseQuery(date);

    return baseQuery.clone()
      .innerJoin('students')
      .andWhere('enrolment_keys.studentId', '=', StageTransition.knex().raw('students.id'))
      .andWhere('enrolment_keys.typeOfTest', 'offlineTest');
  }

  newHelplineStudentsBaseQuery(date) {
    const { StageTransition } = this.server.models();

    const baseQuery = this.newStudentsBaseQuery(date);

    return baseQuery.clone()
      .innerJoin('students')
      .andWhere('enrolment_keys.studentId', '=', StageTransition.knex().raw('students.id'))
      .andWhere('enrolment_keys.typeOfTest', 'onlineTest');
  }

  async stageLevelMetrics(dates) {
    const { StageTransition } = this.server.models();

    const date = moment(dates);
    const promises = [];
    const stageWiseMetrics = [];

    _.each(CONSTANTS.studentStages, (stage) => {
      const baseQuery = StageTransition.knex().count('stage_transitions.id as count').from('stage_transitions')
        .innerJoin('students')
        .where('stage_transitions.studentId', '=', StageTransition.knex().raw('students.id'))
        .andWhere('stage_transitions.toStage', stage)
        .andWhere(StageTransition.knex().raw('DATE(stage_transitions.createdAt)'), date.format('YYYY-MM-DD'));
      promises.push(this.getMetricFromBaseQuery(stage, baseQuery, date).then((metrics) => {
        stageWiseMetrics.push(metrics);
      }));
    });

    await Promise.all(promises);

    return _.flatten(stageWiseMetrics);
  }

  async newIncomingCallMetrics(dates) {
    const { IncomingCall } = this.server.models();

    const date = moment(dates);
    const metricName = 'newIncomingCalls';
    const metrics = [];

    const rows = await IncomingCall.query().count('id as count')
      .where('callType', 'requestCallback')
      .andWhere(IncomingCall.knex().raw('DATE(createdAt)'), date.format('YYYY-MM-DD'));

    metrics.push({
      metricName,
      value: rows[0] ? rows[0].count : 0,
      date,
    });
    return metrics;
  }

  async recordAllMetrics(date, recordNonDate = false) {
    const promises = [];
    let allMetrics = [];

    // new students (from partners)
    const newPartnerStudentsQuery = this.newPartnerStudentsBaseQuery(date);
    promises.push(this.getMetricFromBaseQuery('newPartnerStudents', newPartnerStudentsQuery, date).then((metrics) => allMetrics.push(metrics)));

    // new students (from helpline)
    const newHelplineStudentsQuery = this.newHelplineStudentsBaseQuery(date);
    promises.push(this.getMetricFromBaseQuery('newHelplineStudents', newHelplineStudentsQuery, date).then((metrics) => allMetrics.push(metrics)));

    // stage level metrics
    promises.push(this.stageLevelMetrics(date).then((metrics) => allMetrics.push(metrics)));

    // new incoming calls
    promises.push(this.newIncomingCallMetrics(date).then((metrics) => allMetrics.push(metrics)));

    // 1. some metrics like stale record numbers are calculated in a way where their
    // value at the current moment of time
    // 2. is calculated. so there is no way currently to get the number of stale
    // records on a particular day.
    // 3. until `recordNonDate` is true such metrics are not recorded in the DB.
    if (recordNonDate) {
      // stale records
      const staleRecordsQuery = this.staleRecordsBaseQuery();
      promises.push(this.getMetricFromBaseQuery('staleRecords', staleRecordsQuery, date).then((metrics) => allMetrics.push(metrics)));

      // live records
      const liveRecordsQuery = this.liveRecordsBaseQuery();
      promises.push(this.getMetricFromBaseQuery('liveRecords', liveRecordsQuery, date).then((metrics) => allMetrics.push(metrics)));
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
    let lasRecDate = await Metrics.query().max('date as maxDate').groupBy('date').orderBy('date', 'desc')
      .limit(1);
    lasRecDate = lasRecDate.length > 0 ? moment(lasRecDate[0].maxDate) : null;

    // if last day of metric recording is yesterday (less than 1 day from today) do nothing
    // this is done as all the metrics are recorded at a date level and we will only
    // get accurate metrics for the past day
    const today = moment();
    const yest = today.subtract(1, 'days');
    const datesToRecord = [];
    if (lasRecDate === null) {
      console.log('`lastRecDate` is null');
      // entering here means there are no metrics in the table
      const metricCalcStartDate = moment(CONSTANTS.metricCalculationStartDate);
      const diff = yest.diff(metricCalcStartDate, 'days');
      _.each(_.range(diff + 1), (el, i) => {
        datesToRecord.push(metricCalcStartDate.clone().add(i, 'days'));
      });
    } else if ((lasRecDate.isSame(yest, 'year') && lasRecDate.isSame(yest, 'month') && lasRecDate.isSame(yest, 'day')) !== true) {
      console.log('`lastRecDate` is same as yesterday.');
      // calculate the dates between `last day of metric recording` and yesterday
      const diff = yest.diff(lasRecDate, 'days');
      _.each(_.range(diff), (el, i) => {
        datesToRecord.push(lasRecDate.clone().add(i + 1, 'days'));
      });
    } else {
      console.log('All metrics are up to date. Nothing to do.');
      // last recorded day is same as yesterday
      // we don't need to do anything
      return null;
    }

    const promises = [];

    // call `recordAllMetrics` for all those dates
    _.each(datesToRecord, (date, i) => {
      // make sure `recordNonDate` is true only for yesterday
      if (datesToRecord.length - 1 === i) {
        promises.push(this.recordAllMetrics(date, true));
      } else {
        promises.push(this.recordAllMetrics(date, false));
      }
    });
    const result = await Promise.all(promises);
    return result;
  }

  async getAllMetrics(StartDate, EndDate, metricNames) {
    const { Metrics } = this.server.models();

    // convert dates to strings
    const startDate = moment(StartDate).format('YYYY-MM-DD');
    const endDate = moment(EndDate).format('YYYY-MM-DD');

    // get metrics from the db
    const metrics = await Metrics.query()
      .whereIn('metricName', metricNames)
      .andWhere('date', '>=', startDate)
      .andWhere('date', '<=', endDate);

    // group by date first
    const metricsByDate = _.groupBy(metrics, (metric) => moment(metric.date).format('YYYY-MM-DD'));

    // group the metrics of every date by metric name
    _.each(metricsByDate, (metric, date) => {
      const groupedMetric = _.groupBy(metric, (m) => m.metricName);
      metricsByDate[date] = groupedMetric;
    });

    // calculate the gender level totals of every metric
    const totals = {};
    const gendersInverted = _.invert(CONSTANTS.studentDetails.gender);
    gendersInverted.null = 'noGender';
    const metricsByName = _.groupBy(metrics, (m) => m.metricName);
    _.each(metricNames, (name) => {
      const mName = metricsByName[name];
      const mGender = _.groupBy(mName, (m) => m.gender);
      totals[name] = {};
      _.each(mGender, (m, gender) => {
        const sum = _.reduce(m, (memo, _m) => memo + _m.value, 0);
        totals[name][gendersInverted[gender]] = sum;
      });
    });

    return {
      metrics: metricsByDate,
      totals,
    };
  }
};
