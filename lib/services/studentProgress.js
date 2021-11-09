const Schmervice = require('schmervice');

module.exports = class studentProgressService extends Schmervice.Service {
  async student_progressMade_Cards(data) {
    const studentProgressMade = data;
    const convertedData = {
      Python: {
        M1: [],
        M2: [],
        M3: [],
        M4: [],
        M5: [],
        M6: [],
        M7: [],
        M8: [],
        M9: [],
      },
      JS: {
        M10: [],
      },
      'Node JS': {
        M11: [],
        M13: [],
        M15: [],
        M17: [],
      },
      'React JS': {
        M12: [],
        M14: [],
        M16: [],
        M18: [],
      },
      'Interview preperation': {
        M19: [],
        M20: [],
        M21: [],
        M22: [],
      },
      'Pay forwad': {
        payingForward: [],
        paidForward: [],
      },
      'Got job': {
        inJob: [],
      },
      onLeave: {
        onLeave: [],
      },
      'Drop out': {
        droppedOutDharamshala: [],
        droppedOutBangalore: [],
        droppedOutSarjapura: [],
        droppedOutPune: [],
        droppedOut: [],
      },
    };
    for (const student of studentProgressMade) {
      for (const card of Object.keys(convertedData)) {
        for (const stage of Object.keys(convertedData[card])) {
          if (stage === student.stage) {
            convertedData[card][stage].push(student);
          }
        }
      }
    }
    return convertedData;
  }
};
