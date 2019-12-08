
const Schmervice = require('schmervice');

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
};
