
const Schmervice = require('schmervice');

module.exports = class FeedbackService extends Schmervice.Service {
  async createFeedback(student, user, feedback, txn = null) {
    const { Feedback } = this.server.models();
    const feedbacks = feedback;

    const Student = student;
    const userId = user;

    const create = await Feedback.query(txn).insert({
      studentId: Student.id,
      userId: userId,
      student_stage: feedbacks.student_stage,
      feedback_type: feedbacks.feedback_type,
      feedback: feedbacks.feedback,
      state: feedbacks.state,
      last_updated: Student.createdAt,
    });
    return create;
  }

  async updateFeedback(feedback, studentId, txn = null) {
    const { Feedback } = this.server.models();
    const feedbacks = feedback;
    delete feedbacks.user;
    const update = await Feedback.query(txn).update(feedbacks).where('studentId', studentId);
    return update;
  }
};
