const Schmervice = require("schmervice");
const csv = require("csv-parser");
const fs = require("fs");
const _ = require("underscore");
const CONSTANT = require("../constants");

module.exports = class FeedbackService extends (
  Schmervice.Service
) {
  async addFeedback(student, user, feedback, txn = null) {
    const { Feedback } = this.server.models();
    const feedbacks = feedback;

    const Student = student;
    const user_id = user;
    const finished_at = new Date();
    const existingStage = await Feedback.query(txn)
      .where("student_id", Student.id)
      .andWhere("student_stage", feedbacks.student_stage);
    const details = {
      feedback: feedbacks.feedback,
      finished_at: finished_at,
      last_updated: Student.created_at,
    };

    if (existingStage.length) {
      if (existingStage[0].user_id) {
        const addfeedback = await Feedback.query(txn)
          .update(details)
          .where("student_id", Student.id)
          .andWhere("student_stage", feedbacks.student_stage);
        return addfeedback;
      }
      details.user_id = user_id;
      const addfeedback = await Feedback.query(txn)
        .update(details)
        .where("student_id", Student.id)
        .andWhere("student_stage", feedbacks.student_stage);
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

  async updateFeedback(feedback, student_id, txn = null) {
    const { Feedback } = this.server.models();
    const feedbacks = feedback;
    feedbacks.finished_at = new Date();

    const update = await Feedback.query(txn)
      .update(feedbacks)
      .where("student_id", student_id)
      .andWhere("student_stage", feedbacks.student_stage)
      .whereNotNull("feedback");
    return update;
  }

  async sendSMSto_assignUser(details, txn = null) {
    const { Student } = this.server.models();
    const { exotelService } = this.server.services();
    const [student] = await Student.query(txn)
      .where("id", details.student_id)
      .eager({
        feedbacks: {
          assignUser: true,
        },
      });
    const { mobile } = student.feedbacks.assignUser;
    const templateContext = {
      student,
      user: student.feedbacks,
    };
    const message = await exotelService.sendSMS(
      mobile,
      "assignWork",
      templateContext
    );
    return message;
  }

  async assignFeedbackWork(payload, txn = null) {
    const { Feedback } = this.server.models();
    const details = payload;
    details.deadline_at = new Date();
    console.log(details.student_id, details.student_stage);
    const allreadyAssigned = await Feedback.query(txn)
      .where("student_id", details.student_id)
      .andWhere("student_stage", details.student_stage);
    console.log(allreadyAssigned);

    if (allreadyAssigned.length) {
      const updateAssignedWork = await Feedback.query(txn)
        .update(details)
        .where("student_id", details.student_id)
        .andWhere("student_stage", details.student_stage);

      // await this.sendSMSto_assignUser(details);
      return updateAssignedWork;
    }
    console.log(details);

    const assignedWork = await Feedback.query(txn).insert(details);

    // await this.sendSMSto_assignUser(details);
    return assignedWork;
  }

  async dumpSheetData(txn = null) {
    const { EnrolmentKey, Feedback } = this.server.models();
    const rowdata = {
      rqcCallFeedback: ["requestCallback"],
      pendingAlgebraInterview: ["algIntStatus", "algIntCallFeedback"],
      pendingAlgebraReInterview: ["reAlgIntStatus", "reAlgIntCallFeedback"],
      pendingCultureFitInterview: [
        "cultFitStatus",
        "cultFitCallRawInfo",
        "cultFitInterviewSummary",
        "cultFitBucket",
      ],
      pendingEnglishInterview: ["englishIntStatus", "englishIntCallFeedback"],
      pendingParentConversation: ["parentConversation"],
      pendingTravelPlanning: ["travelPlanning"],
    };

    const data = fs
      .createReadStream("lib/services/dump.csv")
      .pipe(csv())
      .on("data", async (row) => {
        const Student = await EnrolmentKey.query(txn)
          .where("key", row.enrolmentKey)
          .eager({
            student: true,
            transitions: true,
          });
        const details = [];
        if (Student.length) {
          if (Student[0].transitions) {
            _.each(Student[0].transitions, (t) => {
              if (t.to_stage in rowdata) {
                const stage = rowdata[t.to_stage];
                let feedback = "";
                let state;
                for (let i = 0; i <= stage.length; i += 1) {
                  if (/Status/.test(stage[i])) {
                    state = row[stage[i]].toLowerCase();
                  } else if (row[stage[i]]) {
                    feedback = `${feedback}@pralhad18:${"\n\n"}${stage[i]}: ${
                      row[stage[i]]
                    }${"\n\n"}`;
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
      .on("end", () => {
        console.log("CSV file successfully processed");
      });
    return data;
  }

  async alltransitionsWithFeedback(student_id, txn = null) {
    const { StageTransition } = this.server.models();
    const transitions = await StageTransition.query(txn)
      .where("student_id", student_id)
      .eager({
        feedbacks: true,
      });

    _.each(transitions, (transition, index) => {
      if (transition.feedbacks) {
        transitions[index].feedback = transition.feedbacks.feedback;
        transitions[index].to_assign = transition.feedbacks.to_assign;
        transitions[index].state = transition.feedbacks.state;
        transitions[index].deadline = transition.feedbacks.deadline_at;
        transitions[index].finished_at = transition.feedbacks.finished_at;
        transitions[index].time = transition.feedbacks.created_at;
        transitions[index].audio_recording =
          transition.feedbacks.audio_recording;
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
      .where("to_assign", User)
      .eager({ student: true });
    return tasks;
  }

  async myAssignReport(user, txn = null) {
    const { Feedback } = this.server.models();
    const User = user;
    const tasks = await Feedback.query(txn)
      .where("who_assign", User)
      .eager({ student: true })
      .orderBy("created_at", "desc");
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
    let upperLimit = new Date(date).setHours(
      currentDeadline + deadlineShift + 1
    );

    lowerLimit = new Date(lowerLimit);
    upperLimit = new Date(upperLimit);

    const relation = {
      student: true,
      assignUser: true,
    };

    if (templateName == "informToCompleteTheTest") {
      const smsStudents = await Student.query()
        .eager({
          contacts: true,
          enrolmentKey: true,
        })
        .where("stage", "basicDetailsEntered")
        .where("created_at", ">", lowerLimit)
        .where("created_at", "<", upperLimit);

      _.each(smsStudents, (student) => {
        const templateContext = {
          student: student,
          key: student.enrolmentKey.key,
        };
        const { mobile } = student.contacts[0];
        sendSMSPromises.push(
          exotelService.sendSMS(mobile, templateName, templateContext)
        );
      });
    } else {
      const smsUsers = await Feedback.query()
        .eager(relation)
        .whereNull("state")
        .whereNotNull("to_assign")
        .where("deadline_at", ">", lowerLimit)
        .where("deadline_at", "<", upperLimit);

      _.each(smsUsers, (user) => {
        const templateContext = {
          student: user.student,
          user,
        };
        sendSMSPromises.push(
          exotelService.sendSMS(
            user.assignUser.mobile,
            templateName,
            templateContext
          )
        );
      });
    }

    const sendSMS = await Promise.all(sendSMSPromises);
    return sendSMS;
  }

  async informPendingMobilizationWorkto_assignUser() {
    const sendSMSPromises = [
      // send SMS
      this.getSMSPromises(
        -(CONSTANT.deadline.afterDeadline + 1),
        "deadlineEndMessage"
      ),
      this.getSMSPromises(CONSTANT.deadline.beforeDeadline, "deadlineMessage"),
    ];
    return sendSMSPromises;
  }

  async addaudio_recordingUrl(Ids, url, txn = null) {
    const { studentId, userId } = Ids;
    const { audioUrl, student_stage } = url;
    const { Feedback } = this.server.models();
    const existingStage = await Feedback.query(txn)
      .where("student_id", studentId)
      .andWhere("student_stage", student_stage);

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
          .where("student_id", studentId)
          .andWhere("student_stage", student_stage);
        return addAudioUrl;
      }
      const addAudioUrl = await Feedback.query(txn)
        .update(details)
        .where("student_id", studentId)
        .andWhere("student_stage", student_stage);
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
      .eager({
        student: {
          partner: true,
          contacts: true,
          enrolmentKey: true,
          partnerAssessment: true,
          lastTransition: true,
          feedbacks: true,
        },
      })
      .where("to_assign", user)
      .andWhere("feedback", null);

    _.each(studentDetails, (student) => {
      convertedData.push(student.student);
    });

    const pendingTasks = await studentService.softwareCourse(convertedData);
    return pendingTasks;
  }
};
