
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
    const finishedAt = new Date();
    const existingStage = await Feedback.query(txn).where('studentId', Student.id)
      .andWhere('student_stage', feedbacks.student_stage);
    const details = {
      feedback: feedbacks.feedback,
      finishedAt: finishedAt,
      last_updated: Student.createdAt,
    };

    if (existingStage.length) {
      if (existingStage[0].userId) {
        const addfeedback = await Feedback.query(txn).update(details)
          .where('studentId', Student.id).andWhere('student_stage', feedbacks.student_stage);
        return addfeedback;
      }
      details.userId = userId;
      const addfeedback = await Feedback.query(txn).update(details)
        .where('studentId', Student.id).andWhere('student_stage', feedbacks.student_stage);
      return addfeedback;
    }

    const addfeedback = await Feedback.query(txn).insert({
      studentId: Student.id,
      userId: userId,
      student_stage: feedbacks.student_stage,
      feedback: feedbacks.feedback,
      finishedAt: finishedAt,
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
    const { mobile } = student.feedbacks.assignUser;
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
      feedbacks: true,
    });

    _.each(transitions, (transition, index) => {
      if (transition.feedbacks) {
        transitions[index].feedback = transition.feedbacks.feedback;
        transitions[index].toAssign = transition.feedbacks.toAssign;
        transitions[index].state = transition.feedbacks.state;
        transitions[index].deadline = transition.feedbacks.deadlineAt;
        transitions[index].finishedAt = transition.feedbacks.finishedAt;
        transitions[index].time = transition.feedbacks.createdAt;
        transitions[index].audioRecording = transition.feedbacks.audioRecording;
        delete transitions[index].feedbacks;
      } else {
        transitions[index].feedback = null;
        delete transitions[index].feedbacks;
      }
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

  async getSMSPromises(deadlineShift, templateName) {
    const { exotelService } = this.server.services();
    const { Feedback } = this.server.models();

    const sendSMSPromises = [];

    const date = new Date();
    date.setSeconds(0);
    date.setMinutes(0);

    // get current hours
    const currentDeadline = date.getHours();

    // if there was no shift then the current_time ke paas ki jo deadlineAt
    // hoti usmei, we would have sent the messages
    // but since there is a deadline shift, we would send the messages
    // thoda time ko shift kar kar

    // yaani agar hum deadline, se 5 hours pehle message bhejna chahte hai
    // toh abhi se 5 ghante baad ki deadline walo ko sms bhejo

    // yaani agar hum deadline se 2 hours pehle message bhejna chahte hai
    // toh abhi se 2 ghante pehle walo ki deadline walo ko sms bhejo

    let lowerLimit = new Date(date).setHours(currentDeadline + deadlineShift);
    let upperLimit = new Date(date).setHours(currentDeadline + deadlineShift + 1);

    lowerLimit = new Date(lowerLimit);
    upperLimit = new Date(upperLimit);

    const relation = {
      student: true,
      assignUser: true,
    };

    const smsUsers = await Feedback.query().eager(relation).whereNull('state').whereNotNull('toAssign')
      .where('deadlineAt', '>', lowerLimit)
      .where('deadlineAt', '<', upperLimit);

    _.each(smsUsers, (user) => {
      const templateContext = {
        student: user.student,
        user,
      };
      sendSMSPromises.push(exotelService.sendSMS(user.assignUser.mobile,
        templateName, templateContext));
    });
    const sendSMS = await Promise.all(sendSMSPromises);
    return sendSMS;
  }

  async informPendingMobilizationWorkToAssignUser() {
    const sendSMSPromises = [
      // send SMS
      this.getSMSPromises(-(CONSTANT.deadline.afterDeadline + 1), 'deadlineEndMessage'),
      this.getSMSPromises(CONSTANT.deadline.beforeDeadline, 'deadlineMessage'),
    ];
    return sendSMSPromises;
  }

  async addAudioRecordingUrl(Ids, url, txn = null) {
    const { studentId, userId } = Ids;
    const { audioUrl, student_stage } = url;
    const { Feedback } = this.server.models();
    const existingStage = await Feedback.query(txn).where('studentId', studentId)
      .andWhere('student_stage', student_stage);

    const details = {
      audioRecording: audioUrl,
      student_stage: student_stage,
      studentId: studentId,
      userId: userId,
    };

    if (existingStage.length) {
      if (existingStage[0].userId) {
        delete details.userId;
        const addAudioUrl = await Feedback.query(txn).update(details)
          .where('studentId', studentId).andWhere('student_stage', student_stage);
        return addAudioUrl;
      }
      const addAudioUrl = await Feedback.query(txn).update(details)
        .where('studentId', studentId).andWhere('student_stage', student_stage);
      return addAudioUrl;
    }

    const addAudioUrl = await Feedback.query(txn).insert(details);
    return addAudioUrl;
  }

  async pendingInterview(user) {
    const { Feedback } = this.server.models();
    const { studentService } = this.server.services();
    const convertedData = [];
    const studentDetails = await Feedback.query().eager({
      student: {
        partner: true,
        contacts: true,
        enrolmentKey: true,
        partnerAssessment: true,
        lastTransition: true,
        feedbacks: true,
      },
    })
      .where('toAssign', user).andWhere('feedback', null);

    _.each(studentDetails, (student) => {
      convertedData.push(student.student);
    });

    const pendingTasks = await studentService.softwareCourse(convertedData);
    return pendingTasks;
  }
};
