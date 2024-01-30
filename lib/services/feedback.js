const Schmervice = require('schmervice');
const csv = require('csv-parser');
const fs = require('fs');
const _ = require('underscore');
const CONSTANT = require('../constants');
const logger = require('../../server/logger');

module.exports = class FeedbackService extends Schmervice.Service {
  async addFeedback(student, user, feedback, txn = null) {
    const { Feedback } = this.server.models();
    const feedbacks = feedback;

    const Student = student;
    const user_id = user;
    const finished_at = new Date();
    const existingStage = await Feedback.query(txn)
      .where('student_id', Student.id)
      .andWhere('student_stage', feedbacks.student_stage);
    const details = {
      feedback: feedbacks.feedback,
      finished_at: finished_at,
      last_updated: Student.created_at,
    };

    if (existingStage.length) {
      if (existingStage[0].user_id) {
        const addfeedback = await Feedback.query(txn)
          .update(details)
          .where('student_id', Student.id)
          .andWhere('student_stage', feedbacks.student_stage);
        return addfeedback;
      }
      details.user_id = user_id;
      const addfeedback = await Feedback.query(txn)
        .update(details)
        .where('student_id', Student.id)
        .andWhere('student_stage', feedbacks.student_stage);
      return addfeedback;
    }

    const addfeedback = await Feedback.query(txn).insert({
      student_id: Student.id,
      user_id: user_id,
      student_stage: feedbacks.student_stage,
      feedback: feedbacks.feedback,
      finished_at: finished_at,
      last_updated: Student.created_at,
    });
    return addfeedback;
  }

  async addNotificationHistory(notification_status, feedback_id, student_id, txn = null) {
    const { Feedback } = this.server.models();
    const notification_sent_at = new Date().toString();
    const details = {
      notification_status: notification_status,
      notification_sent_at: notification_sent_at,
    };
    let status = details.notification_status;
    let sent_at = details.notification_sent_at;

    const addHistory = await Feedback.query(txn)
      .select('notification_sent_at', 'notification_status')
      .where('id', feedback_id);

    details.notification_status = addHistory[0].notification_status + ', ' + status;
    details.notification_sent_at = addHistory[0].notification_sent_at + ', ' + sent_at;

    const addNotification = await Feedback.query(txn).update(details).where('id', feedback_id);
    return addNotification;
  }

  async updateFeedback(feedback, student_id, txn = null) {
    const { Feedback, Student } = this.server.models();
    const { ownersService } = this.server.services();
    const feedbacks = feedback;
    feedbacks.finished_at = new Date();
    let update;
    try {
      console.log('inside the try block::::::::::::::::::');
      update = await Feedback.query(txn)
        .update(feedbacks)
        .where('student_id', student_id)
        .andWhere('student_stage', feedbacks.student_stage)
        .whereNotNull('feedback');
      if (feedbacks.state) {
        const ownerId = await Student.query().where('id', student_id).select('current_owner_id');
        await Student.query().update({ current_owner_id: null }).where('id', student_id);
        await ownersService.pendingInterviewUpdate(ownerId[0].current_owner_id);
      }
    } catch (err) {
      if (err) {
        logger.error(JSON.stringify(err));
        return { message: err.message, error: true };
      }
    }
    return update;
  }

  async updateOrInsertByStudentStage(feedback, studentId, txn = null) {
    const { Feedback } = this.server.models();
    const feedbacks = feedback;
    const Count = await Feedback.query(txn).where('student_id', studentId).count();
    let update;
    if (Count[0].count > 0) {
      update = await Feedback.query(txn).update(feedbacks).where('student_id', studentId);
    } else {
      update = await Feedback.query(txn).insertGraph({
        student_id: studentId,
        ...feedbacks,
      });
    }
    return update;
  }

  async updateOrInsertByStage(feedback, studentId, txn = null) {
    const { Feedback } = this.server.models();
    const feedbacks = feedback;
    const Count = await Feedback.query(txn).where('student_id', studentId).count();
    let update;
    if (Count[0].count > 0) {
      update = await Feedback.query(txn).update(feedbacks).where('student_id', studentId);
    } else {
      update = await Feedback.query(txn).insertGraph({
        student_id: studentId,
        ...feedbacks,
      });
    }
    return update;
  }

  async sendSMSto_assignUser(details, txn = null) {
    const { Student } = this.server.models();
    const { exotelService } = this.server.services();
    const [student] = await Student.query(txn)
      .where('id', details.student_id)
      .withGraphFetched({
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
    const { ownersService } = this.server.services();
    const details = payload;
    details.deadline_at = new Date();
    console.log(details.student_id, details.student_stage);
    const allreadyAssigned = await Feedback.query(txn)
      .where('student_id', details.student_id)
      .andWhere('student_stage', details.student_stage);
    ownersService.pendingInterviewUpdateByToAssign(details);

    if (allreadyAssigned.length) {
      const updateAssignedWork = await Feedback.query(txn)
        .update(details)
        .where('student_id', details.student_id)
        .andWhere('student_stage', details.student_stage);

      // await this.sendSMSto_assignUser(details);
      return updateAssignedWork;
    }

    const assignedWork = await Feedback.query(txn).insert(details);

    // await this.sendSMSto_assignUser(details);
    return assignedWork;
  }
  async dumpSheetData(txn = null) {
    const { EnrolmentKey, Feedback } = this.server.models();
    const rowdata = {
      rqcCallFeedback: ['requestCallback'],
      pendingAlgebraInterview: ['algIntStatus', 'algIntCallFeedback'],
      pendingAlgebraReInterview: ['reAlgIntStatus', 'reAlgIntCallFeedback'],
      pendingCultureFitInterview: [
        'cultFitStatus',
        'cultFitCallRawInfo',
        'cultFitInterviewSummary',
        'cultFitBucket',
      ],
      pendingEnglishInterview: ['englishIntStatus', 'englishIntCallFeedback'],
      pendingParentConversation: ['parentConversation'],
      pendingTravelPlanning: ['travelPlanning'],
    };

    const data = fs
      .createReadStream('lib/services/dump.csv')
      .pipe(csv())
      .on('data', async (row) => {
        const Student = await EnrolmentKey.query(txn)
          .where('key', row.enrolmentKey)
          .withGraphFetched({
            student: true,
            transitions: true,
          });
        const details = [];
        if (Student.length) {
          if (Student[0].transitions) {
            _.each(Student[0].transitions, (t) => {
              if (t.to_stage in rowdata) {
                const stage = rowdata[t.to_stage];
                let feedback = '';
                let state;
                for (let i = 0; i <= stage.length; i += 1) {
                  if (/Status/.test(stage[i])) {
                    state = row[stage[i]].toLowerCase();
                  } else if (row[stage[i]]) {
                    feedback = `${feedback}@pralhad18:${'\n\n'}${stage[i]}: ${
                      row[stage[i]]
                    }${'\n\n'}`;
                  }
                }
                details.push({
                  student_id: t.student_id,
                  state: state,
                  student_stage: t.to_stage,
                  feedback: feedback,
                  last_updated: t.created_at,
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
  async updateDeadlineOrFinishedAt(transitionId, payload) {
    const { Feedback } = this.server.models();
    const { StageTransition } = this.server.models();
    const transitions = await StageTransition.query().where('id', transitionId).withGraphFetched({
      feedbacks: true,
    });
    if (transitions.length > 0) {
      if (transitions[0].feedbacks) {
        return await Feedback.query().update(payload).where('id', transitions[0].feedbacks.id);
      }
    }
  }

  async alltransitionsWithFeedback(student_id, txn = null) {
    const { StageTransition, StudentStage, StudentSchool } = this.server.models();
    const transitions = await StageTransition.query(txn)
      .where('student_id', student_id)
      .withGraphFetched({
        feedbacks: true,
      })
      .orderBy('id', 'asc');
    _.each(transitions, (transition, index) => {
      if (transition.feedbacks) {
        transitions[index].feedback_id = transition.feedbacks.id;
        transitions[index].notification_sent_at = transition.feedbacks.notification_sent_at;
        transitions[index].notification_status = transition.feedbacks.notification_status;
        transitions[index].feedback = transition.feedbacks.feedback;
        transitions[index].to_assign = transition.feedbacks.to_assign;
        transitions[index].state = transition.feedbacks.state;
        transitions[index].deadline = transition.feedbacks.deadline_at;
        transitions[index].finished_at = transition.feedbacks.finished_at;
        transitions[index].time = transition.feedbacks.created_at;
        transitions[index].audio_recording = transition.feedbacks.audio_recording;
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
    const tasks = await Feedback.query(txn)
      .where('to_assign', User)
      .withGraphFetched({ student: true });
    return tasks;
  }

  async myAssignReport(user, txn = null) {
    const { Feedback } = this.server.models();
    const User = user;
    const tasks = await Feedback.query(txn)
      .where('who_assign', User)
      .withGraphFetched({ student: true })
      .orderBy('created_at', 'desc');
    return tasks;
  }

  async getSMSPromises(deadlineShift, templateName) {
    const { exotelService } = this.server.services();
    const { Feedback, Student } = this.server.models();

    const sendSMSPromises = [];

    const date = new Date();
    date.setSeconds(0);
    date.setMinutes(0);

    // get current hours
    const currentDeadline = date.getHours();

    // if there was no shift then the current_time ke paas ki jo deadline_at
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

    if (templateName == 'informToCompleteTheTest') {
      const smsStudents = await Student.query()
        .withGraphFetched({
          contacts: true,
          enrolmentKey: true,
        })
        .where('stage', 'basicDetailsEntered')
        .where('created_at', '>', lowerLimit)
        .where('created_at', '<', upperLimit);

      _.each(smsStudents, (student) => {
        const templateContext = {
          student: student,
          key: student.enrolmentKey.key,
        };
        const { mobile } = student.contacts[0];
        sendSMSPromises.push(exotelService.sendSMS(mobile, templateName, templateContext));
      });
    } else {
      const smsUsers = await Feedback.query()
        .withGraphFetched(relation)
        .whereNull('state')
        .whereNotNull('to_assign')
        .where('deadline_at', '>', lowerLimit)
        .where('deadline_at', '<', upperLimit);

      _.each(smsUsers, (user) => {
        const templateContext = {
          student: user.student,
          user,
        };
        sendSMSPromises.push(
          exotelService.sendSMS(user.assignUser.mobile, templateName, templateContext)
        );
      });
    }

    const sendSMS = await Promise.all(sendSMSPromises);
    return sendSMS;
  }

  async informPendingMobilizationWorkto_assignUser() {
    const sendSMSPromises = [
      // send SMS
      this.getSMSPromises(-(CONSTANT.deadline.afterDeadline + 1), 'deadlineEndMessage'),
      this.getSMSPromises(CONSTANT.deadline.beforeDeadline, 'deadlineMessage'),
    ];
    return sendSMSPromises;
  }

  async statusCheck(id, txn = null) {
    try {
      const { Feedback } = this.server.models();
      const feedbacks = await Feedback.query(txn).where('id', id);
      return feedbacks;
    } catch (err) {
      logger.error(
        JSON.stringify({
          error: true,
          message: err,
        })
      );
      return { message: err };
    }
  }

  async addaudio_recordingUrl(Ids, url, txn = null) {
    const { studentId, userId } = Ids;
    const { audioUrl, student_stage } = url;
    const { Feedback } = this.server.models();
    const existingStage = await Feedback.query(txn)
      .where('student_id', studentId)
      .andWhere('student_stage', student_stage);

    const details = {
      audio_recording: audioUrl,
      student_stage: student_stage,
      student_id: studentId,
      user_id: userId,
    };

    if (existingStage.length) {
      if (existingStage[0].user_id) {
        delete details.userId;
        const addAudioUrl = await Feedback.query(txn)
          .update(details)
          .where('student_id', studentId)
          .andWhere('student_stage', student_stage);
        return addAudioUrl;
      }
      const addAudioUrl = await Feedback.query(txn)
        .update(details)
        .where('student_id', studentId)
        .andWhere('student_stage', student_stage);
      return addAudioUrl;
    }

    const addAudioUrl = await Feedback.query(txn).insert(details);
    return addAudioUrl;
  }

  async pendingInterview(user) {
    const { Feedback } = this.server.models();
    const { studentService } = this.server.services();
    const convertedData = [];
    const studentDetails = await Feedback.query()
      .withGraphFetched({
        student: {
          partner: true,
          contacts: true,
          enrolmentKey: true,
          partnerAssessment: true,
          lastTransition: true,
          feedbacks: true,
        },
      })
      .where('to_assign', user)
      .andWhere('feedback', null);

    _.each(studentDetails, (student) => {
      convertedData.push(student.student);
    });

    const pendingTasks = await studentService.softwareCourse(convertedData);
    return pendingTasks;
  }
  async joinedCampusDate(studentId, txn) {
    const { StageTransition } = this.server.models();
    const { studentService } = this.server.services();

    const leaveStart = await StageTransition.query(txn)
      .where('student_id', studentId)
      .andWhere('to_stage', 'like', 'onLeave')
      .orderBy('created_at');
    const leaveEnd = await StageTransition.query(txn)
      .where('student_id', studentId)
      .andWhere('from_stage', 'like', 'onLeave')
      .orderBy('created_at');
    // console.log(leaveStart, leaveEnd);
    var totalLeaveDays = 0;
    for (var index in leaveEnd) {
      if (leaveStart[index] != undefined) {
        let startDate = leaveStart[index].created_at;
        let endDate = leaveEnd[index].created_at;
        totalLeaveDays += await studentService.leaveDaysCalculate(startDate, endDate);
      }
    }
    const transitions = await StageTransition.query(txn)
      .where('student_id', studentId)
      .andWhere('to_stage', 'like', 'finally%');
    if (transitions.length > 0) {
      var returnValue = transitions[0].created_at;
    } else {
      var returnValue = null;
    }
    // console.log(returnValue, totalLeaveDays);
    return [returnValue, totalLeaveDays];
  }
};
