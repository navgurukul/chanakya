//TODO validations for redflags
const markRedFlag = (s) => {
  let redflag = "";

  //Email validation

  if (!validateEmail(s.email)) {
    redflag += "emial is not valid";
  }
  //Job kab lagega validation
  //if this is empty or date is refering to the past
  const currDate = new Date();
  const jDate = new Date(s.jobKabLagega);
  if (
    s.jobKabLagega == null ||
    (jDate.getDate() < currDate.getDate() &&
      jDate.getMonth() < currDate.getMonth())
  ) {
    redflag += "Job kab lagegi is not valid,";
  }

  //Joined Date validation

  if (s.joinedDate == null) {
    redflag += "joinedDate is not available";
  }

  //If evaluation field is empty
  if (s.evaluation != null) {
    redflag += "evaluation is not available";
  }
  return redflag;
};

const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};
module.exports = { markRedFlag };
