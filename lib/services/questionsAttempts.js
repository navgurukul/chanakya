const Schmervice = require('schmervice');

module.exports = class QuestionAttemptService extends Schmervice.Service {


    async findByEnrolmentKey(enrolment_keys) {
        const { EnrolmentKey } = this.server.models();
        const enrolmentKey = await EnrolmentKey.query().select('id').where('key',enrolment_keys);
        return enrolmentKey;
    };



}