
const Schmervice = require('schmervice');
const csv = require('csv-parser');
const fs = require('fs');
const _ = require('underscore');
const CONSTANT = require('../constants');

module.exports = class FeedbackService extends Schmervice.Service {
  async addFeedback(student, user, feedback, txn = null) {
    const { Feedback } = this.server.models();
    const feedbacks = feedback;

    const Student = student;
    const userId = user;
    const existingStage = await Feedback.query(txn).where('studentId', Student.id)
      .andWhere('student_stage', feedbacks.student_stage);
    if (existingStage.length) {
      const addfeedback = await Feedback.query(txn).update({
        userId: userId,
        feedback: feedbacks.feedback,
        last_updated: Student.createdAt,
      }).where('studentId', Student.id).andWhere('student_stage', feedbacks.student_stage);
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
    feedbacks.finishedAt = new Date();

    const update = await Feedback.query(txn).update(feedbacks).where('studentId', studentId)
      .andWhere('student_stage', feedbacks.student_stage)
      .whereNotNull('feedback');
    return update;
  }

  async sendSMStoAssignUser(details, txn = null) {
    const { Student } = this.server.models();
    const { exotelService } = this.server.services();
    const [student] = await Student.query(txn).where('id', details.studentId).eager({
      feedbacks: {
        assignUser: true,
      },
    });
    const { mobile } = student.feedbackRelation.assignUser;
    const templateContext = {
      student,
      user: student.feedbacks,
    };
    const message = await exotelService.sendSMS(mobile, 'assignWork', templateContext);
    return message;
  }

  async assignFeedbackWork(payload, txn = null) {
    const { Feedback } = this.server.models();
    const details = payload;
    details.deadlineAt = new Date();

    const allreadyAssigned = await Feedback.query(txn).where('studentId', details.studentId)
      .andWhere('student_stage', details.student_stage);
    if (allreadyAssigned.length) {
      const updateAssignedWork = await Feedback.query(txn).update(details)
        .where('studentId', details.studentId)
        .andWhere('student_stage', details.student_stage);

      await this.sendSMStoAssignUser(details);
      return updateAssignedWork;
    }

    const assignedWork = await Feedback.query(txn).insert(details);

    await this.sendSMStoAssignUser(details);
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
                const stage = rowdata[t.toStage];
                let feedback = '';
                let state;
                for (let i = 0; i <= stage.length; i += 1) {
                  if (/Status/.test(stage[i])) {
                    state = row[stage[i]].toLowerCase();
                  } else if (row[stage[i]]) {
                    feedback = `${feedback}@pralhad18:${'\n\n'}${stage[i]}: ${row[stage[i]]}${'\n\n'}`;
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

  async alltransitionsWithFeedback(studentId, txn = null) {
    const { StageTransition } = this.server.models();
    const transitions = await StageTransition.query(txn).where('studentId', studentId).eager({
      feedback: true,
    });
    return transitions;
  }

  async myTaskReport(user, txn = null) {
    const { Feedback } = this.server.models();
    const User = user;
    const tasks = await Feedback.query(txn).where('toAssign', User).eager({ student: true });
    return tasks;
  }

  async myAssignReport(user, txn = null) {
    const { Feedback } = this.server.models();
    const User = user;
    const tasks = await Feedback.query(txn).where('whoAssign', User).eager({ student: true });
    return tasks;
  }

  async getSMSPromises(deadline, templateName) {
    const { exotelService } = this.server.services();
    const { Feedback } = this.server.models();

    let sendSMSPromises = [];

    let date = new Date();
    date.setSeconds(0);
    date.setMinutes(0);
    const hours = date.getHours();

    let lowerLimit = new Date(date).setHours(hours - deadline);
    let upperLimit = new Date(date).setHours(hours - deadline + 1);

    lowerLimit = new Date(lowerLimit);
    upperLimit = new Date(upperLimit);

    const relation = {
      student: true,
      assignUser: true,
    }

    const smsUsers = await Feedback.query().eager(relation).whereNull('state').whereNotNull('toAssign')
    .where('deadlineAt', '>', lowerLimit).where('deadlineAt', '<', upperLimit)

    _.each(smsUsers, (user) => {
      const templateContext = {
        student: user.student,
        user,
      };
      sendSMSPromises.push(exotelService.sendSMS(user.assignUser.mobile, templateName, templateContext));
    });
    
    return await Promise.all(sendSMSPromises);
  }
  
  async informPendingMobilizationWorkToAssignUser() {

    const sendSMSPromises = [
      this.getSMSPromises(CONSTANT.deadline.afterDeadline + 1, 'deadlineMessage'),
      this.getSMSPromises(-CONSTANT.deadline.beforeDeadline, 'deadlineEndMessage')
    ];

    return sendSMSPromises;
  }
};
