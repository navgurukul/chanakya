const Schmervice = require('schmervice');
const _ = require('lodash');
const date = require('date-and-time');
const fs = require('fs');

module.exports = class graphService extends Schmervice.Service {
  async percentage(value, totalLength, jobKabLagegaNull) {
    const v = (value / (totalLength - jobKabLagegaNull)) * 100;
    return v;
  }

  async graph(data) {
    const graphDataReal = [
      { name: 'Time  < 9 Months', value: 0, studentNames: [] },
      { name: 'Time  >=9 months and <12 months', value: 0, studentNames: [] },
      { name: 'Time  >=12 months and <15 months', value: 0, studentNames: [] },
      { name: 'Time  >=15 months and <18 months', value: 0, studentNames: [] },
      { name: 'Time   >=18 months', value: 0, studentNames: [] },
    ];
    const studentNamesOfStudentsWithOutMilestone = [];
    const totalLength = data.length;
    let jobKabLagegaNull = 0;
    for (const i of data) {
      if (i.jobKabLagega != null) {
        const joinedDate = new Date(i.joinedDate);
        const nineMonthFromJoinedDate = date.addMonths(joinedDate, 9);
        const twelveMonthFromJoinedDate = date.addMonths(joinedDate, 12);
        const fifteenMonthFromJoinedDate = date.addMonths(joinedDate, 15);
        const eighteenMonthFromJoinedDate = date.addMonths(joinedDate, 18);
        const jobKabLagega = i.jobKabLagega.expectedDate;
        if (new Date(jobKabLagega) < nineMonthFromJoinedDate) {
          graphDataReal[0].value += 1;
          graphDataReal[0].studentNames.push(i.name);
        } else if (
          new Date(jobKabLagega) >= nineMonthFromJoinedDate
          && new Date(jobKabLagega) < twelveMonthFromJoinedDate
        ) {
          graphDataReal[1].value += 1;
          graphDataReal[1].studentNames.push(i.name);
        } else if (
          new Date(jobKabLagega) >= twelveMonthFromJoinedDate
          && new Date(jobKabLagega) < fifteenMonthFromJoinedDate
        ) {
          graphDataReal[2].value += 1;
          graphDataReal[2].studentNames.push(i.name);
        } else if (
          new Date(jobKabLagega) >= fifteenMonthFromJoinedDate
          && new Date(jobKabLagega) < eighteenMonthFromJoinedDate
        ) {
          graphDataReal[3].value += 1;
          graphDataReal[3].studentNames.push(i.name);
        } else {
          graphDataReal[4].value += 1;
          graphDataReal[4].studentNames.push(i.name);
        }
      } else {
        jobKabLagegaNull += 1;
        studentNamesOfStudentsWithOutMilestone.push(i.name);
      }
    }
    graphDataReal[4].percentage = await this.percentage(
      graphDataReal[4].value,
      totalLength,
      jobKabLagegaNull,
    );
    graphDataReal[3].percentage = await this.percentage(
      graphDataReal[3].value,
      totalLength,
      jobKabLagegaNull,
    );
    graphDataReal[2].percentage = await this.percentage(
      graphDataReal[2].value,
      totalLength,
      jobKabLagegaNull,
    );
    graphDataReal[1].percentage = await this.percentage(
      graphDataReal[1].value,
      totalLength,
      jobKabLagegaNull,
    );
    graphDataReal[0].percentage = await this.percentage(
      graphDataReal[0].value,
      totalLength,
      jobKabLagegaNull,
    );
    return {
      note: 'Graph is based on job kab lagega column',
      graphData: graphDataReal,
      noOfStudentsWithOutMilestone: jobKabLagegaNull,
      studentNamesOfStudentsWithOutMilestone:
        studentNamesOfStudentsWithOutMilestone,
      noOfStudentsWithMilestone: totalLength - jobKabLagegaNull,
      totalStudents: totalLength,
    };
  }
};
