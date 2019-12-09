
const Schmervice = require('schmervice');
const csv = require('csv-parser');
const fs = require('fs');
const _ = require('underscore');

module.exports = class FeedbackService extends Schmervice.Service {
  async addFeedback(student, user, feedback, txn = null) {
    const { Feedback } = this.server.models();
    const feedbacks = feedback;

    const Student = student;
    const userId = user;
    const existingStage = await Feedback.query(txn).where('studentId', Student.id)
      .andWhere('student_stage', feedbacks.student_stage);
    if (existingStage) {
      const addfeedback = await Feedback.query(txn).update({
        userId: userId,
        feedback: feedbacks.feedback,
        last_updated: Student.createdAt,
      });
      return addfeedback;
    }
    const addfeedback = await Feedback.query(txn).insert({
      studentId: Student.id,
      userId: userId,
      student_stage: feedbacks.student_stage,
      feedback: feedbacks.feedback,
      state: feedbacks.state,
      last_updated: Student.createdAt,
    });
    return addfeedback;
  }

  async updateFeedback(feedback, studentId, txn = null) {
    const { Feedback } = this.server.models();
    const feedbacks = feedback;
    const update = await Feedback.query(txn).update(feedbacks).where('studentId', studentId)
      .andWhere('student_stage', feedbacks.student_stage);
    return update;
  }

  async assignFeedbackWork(payload, txn = null) {
    const { Feedback } = this.server.models();
    const details = payload;
    const allreadyAssigned = await Feedback.query(txn).where('studentId', details.studentId)
      .andWhere('student_stage', details.student_stage);
    if (allreadyAssigned.length) {
      const updateAssignedWork = await Feedback.query(txn).update(details)
        .where('studentId', details.studentId)
        .andWhere('student_stage', details.student_stage);
      return updateAssignedWork;
    }
    const assignedWork = await Feedback.query(txn).insert(details);
    return assignedWork;
  }

  async dumpSheetData(txn = null) {
    const { EnrolmentKey, Feedback } = this.server.models();
    const rowdata = {
      rqcCallFeedback: ['requestCallback'],
      pendingAlgebraInterview: ['algIntStatus', 'algIntCallFeedback'],
      pendingAlgebraReInterview: ['reAlgIntStatus', 'reAlgIntCallFeedback'],
      pendingCultureFitInterview: ['cultFitStatus', 'cultFitCallRawInfo', 'cultFitInterviewSummary', 'cultFitBucket'],
      pendingEnglishInterview: ['englishIntStatus', 'englishIntCallFeedback'],
      pendingParentConversation: ['parentConversation'],
      pendingTravelPlanning: ['travelPlanning'],
    };

    const data = fs.createReadStream('lib/services/dump.csv')
      .pipe(csv())
      .on('data', async (row) => {
        const Student = await EnrolmentKey.query(txn).where('key', row.enrolmentKey).eager({
          student: true,
          transitions: true,
        });
        const details = [];
        if (Student.length) {
          if (Student[0].transitions) {
            _.each(Student[0].transitions, (t) => {
              if (t.toStage in rowdata) {
                const stages = rowdata[t.toStage];
                let feedback = '';
                let state;
                for (let i = 0; i <= stages.length; i += 1) {
                  if (/Status/.test(stages[i])) {
                    state = row[stages[i]].toLowerCase();
                  } else if (row[stages[i]]) {
                    feedback = `${feedback}@pralhad18:\n${stages[i]}: ${row[stages[i]]}\n`;
                  }
                }
                details.push({
                  studentId: t.studentId,
                  state: state,
                  student_stage: t.toStage,
                  feedback: feedback,
                  last_updated: t.createdAt,
                });
              }
            });
          }
        }
        if (details.length) {
          await Feedback.query(txn).insertGraph(details);
        }
      })
      .on('end', () => {
        console.log('CSV file successfully processed');
      });
    return data;
  }
};
