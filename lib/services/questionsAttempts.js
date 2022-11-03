const Schmervice = require('schmervice');

module.exports = class QuestionAttemptService extends Schmervice.Service {
    
    async findByEnrolmentKey(enrolment_keys) {
        const { EnrolmentKey } = this.server.models();
        const enrolmentKey = await EnrolmentKey.query().select('id').where('key',enrolment_keys);
        let keyId;
        for ( let i of enrolmentKey){
            keyId=i.id;
        }    
        return keyId;
    };

    async findQuestionIdByEnrolmentKeyId(enrolment_keys,txn = null){
        const { QuestionAttempt } = this.server.models();
        const id = await this.findByEnrolmentKey(enrolment_keys)
        const questions = await QuestionAttempt.query(txn).throwIfNotFound().where('enrolment_key_id',id);
        let studentInfo={};
        let questionsNumList =[];
        let textAnswer=[];
        let selectedOptionId=[];
        for (const id of questions) {
            questionsNumList.push(id.question_id);
            selectedOptionId.push(id.selected_option_id);
            if(id.text_answer !==null){
                textAnswer.push(id.text_answer)
            };
        }
        studentInfo['questionsNumList']=questionsNumList;
        studentInfo['textAnswer']=textAnswer;
        studentInfo['selectedOptionId']=selectedOptionId;
        return studentInfo;
    }

  

    // async findChoicesBybucket_id(bucket_id, txn = null) {
    //     const { QuestionBucketChoice, Question } = this.server.models();
    
    //     const choices = await QuestionBucketChoice.query(txn).where({ bucket_id });
    //     const promises = [];
    //     _.each(choices, (choice, i) => {
    //       const { question_ids } = choice;
    //       promises.push(Question.query(txn).whereIn('id', question_ids).then((questions) => {
    //         choices[i].questions = questions;
    //       }));
    //     });
    //     await Promise.all(promises);
    
    //     return choices;
    // };



}