const markRedFlag = (s) => {
  let redflag = "";

  //Email validation

  if (!validateEmail(s.email)) {
    redflag += "Email-Invalid, ";
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
    redflag += "JobKabLagegi-Invalid, ";
  }

  //If evaluation field is empty
  if (s.evaluation == null) {
    redflag += "Evaluation-NotAvailable, ";
  }
  return redflag;
};
const joinDateValidation = (transitions) => {
  return (
    transitions.filter((transition) => transition.to_stage === "finallyJoined")
      .length > 1
  );
};
const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};
module.exports = { markRedFlag, joinDateValidation };
