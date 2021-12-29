// var DEBUG = false;
var DEBUG = false;
var current_language = "hi";
const partner_refer = [
  "Shikhar School",
  "Lend a Hand India (LAHI)",
  "Charter for Compassionate",
  "Naz Foundation",
  "Youth for Seva",
  "CSEI",
  "Bharti Foundation",
  "Etasha",
  "Teach for India",
  "Sahyogini",
  "Social Media",
  "Website",
  "Friend/Family",
  "Others",
];
// Sentry.init({
//   dsn: "https://15afe9937fcb4b32b902ab2795ae6d07@sentry.io/1421126",
//   environment: DEBUG ? "staging" : "production",
// });

if (!DEBUG) {
  var base_url = "/api";
  var enrolment_key = window.location.href
    .split("k/")
    .slice(-1)[0]
    .split("?")[0];
} else {
  var enrolment_key = "IOKMC9";
  var base_url = "http://localhost:3000";
}

var slide_up_time = 600;
var slide_down_time = slide_down_time;
var questions = [];
var answers = {};
var dirty_answers = [];
var current_question = 0;
var qDisplayed = false;
var testMarks = 0;

function appending(error) {
  $(".errors").html("");
  $(".errors").html(error);
}

function getQuestion(question) {
  if (question["common_text"]) {
    return (
      question[current_language + "_text"] + "<br>" + question["common_text"]
    );
  } else {
    return question[current_language + "_text"];
  }
}

function dQuestions() {
  qDisplayed = true;

  for (i = 0; i < questions.length; i++) {
    dirty_answers.push(-1);
  }
  $("#btns_next_submit").show("slow");
  displayQuestion(0);
}

// For getting lat and long
var positions = { latitude: -1, longitude: -1 };
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (positions) => {
      positions = positions.coords;
    },
    (error) => {
      //appending('Geolocation not supported!');
    }
  );
} else {
  //appending('Geolocation not supported!');
}

function landing_page_submit() {
  mixpanel.track("Personal Details");
  $("#landing_page").slideUp(slide_up_time);
  $("#no_cheating_promise").slideDown(slide_down_time);
}

function no_cheating_promise_submit() {
  mixpanel.track("No Cheating Promise");
  $("#no_cheating_promise").slideUp(slide_up_time);
  $("#personal_details").slideDown(slide_down_time);
  setupDatePicker();
}
function setupDatePicker() {
  var monthdict = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    April: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
  };

  // To get the year
  var today = new Date();
  var yyyy = today.getFullYear() - 10;
  minyyyy = yyyy - 30;

  var datefield = $("#date");
  for (var i = 1; i <= 31; i++) {
    datefield.append("<option value=" + i + ">" + i + "</option>");
  }

  var monthfield = $("#month");
  for (var key in monthdict) {
    monthfield.append(
      "<option value=" + monthdict[key] + ">" + key + "</option>"
    );
  }
  var yearfield = $("#year");

  for (var i = minyyyy; i <= yyyy; i++) {
    yearfield.append("<option value=" + i + ">" + i + "</option>");
  }
}

function fetchQuestionsAndOptions() {
  $.post(
    base_url + "/on_assessment/questions/" + enrolment_key,
    {},
    (data, resp) => {
      questions = data["data"];
      $("#page2").slideUp(slide_up_time);
      $("#time_aware").slideDown(slide_down_time);
      if (!qDisplayed) {
        dQuestions();
      }
    },
    "json"
  ).fail(function (response) {
    mixpanel.track("Error in fetching questions and options.");
    // try {
    //   Sentry.captureException(response);
    // } catch (e) {}
  });
}

function fetchState() {
  $.ajax({
    url: "https://api.countrystatecity.in/v1/countries/IN/states", //API URL
    type: "GET",
    headers: {
      accept: "application/json",
      "X-CSCAPI-KEY":
        "TzZrb2p0emtqa29BOW0zTnpLZHdzOVdjNmlubnRDMmtqOEgxRXpFdw==",
    },
    beforeSend: function () {
      // This function calls before ajax API Hits
    },
    success: function (response, status) {
      for (var i = 0; i < response.length; i++) {
        $("#state").append(
          "<option id='" +
            response[i]["id"] +
            "' value='" +
            response[i]["iso2"] +
            "'>" +
            response[i]["name"] +
            "</option>"
        );
      }
    },
    error: function (error, status) {},
  });

  var select = document.getElementById("state");
  var input = document.getElementById("district");
  select.onchange = function (value) {
    getCityFromState(value.target.value);
    input.value = select.value;
  };
}

function getInfo() {
  //declearing html elements

  const imgDiv = document.querySelector(".profile-pic-div");
  const img = document.querySelector("#photo");
  const file = document.querySelector("#file");
  const uploadBtn = document.querySelector("#uploadBtn");
  const uploadText = document.querySelector("#uploadText");

  //if user hover on img div

  imgDiv.addEventListener("mouseenter", function () {
    uploadBtn.style.display = "block";
  });

  //if we hover out from img div

  imgDiv.addEventListener("mouseleave", function () {
    uploadBtn.style.display = "none";
  });

  //if we hover on upload your photo text
  uploadText.addEventListener("mouseenter", function () {
    uploadBtn.style.display = "block";
  });

  //if we hover out from upload your photo text
  uploadText.addEventListener("mouseleave", function () {
    uploadBtn.style.display = "none";
  });

  //image showing functionality when we choose an image to upload

  //when we choose a photo to upload

  file.addEventListener("change", function () {
    //this refers to file
    const choosedFile = this.files[0];

    if (choosedFile) {
      const reader = new FileReader(); //FileReader is a predefined function of JS

      reader.addEventListener("load", function () {
        img.setAttribute("src", reader.result);
      });

      reader.readAsDataURL(choosedFile);
      console.log(base_url + "i am base url" + enrolment_key + "enrolment key");

      var formdata = new FormData();
      formdata.append("file", choosedFile);

      fetch(`${base_url}/on_assessment/details/photo/${enrolment_key}`, {
        method: "POST",
        body: formdata,
        headers: {
          uploadType: "profileimage",
        },
      }).then((response) => {
        console.log("got error in uploading photo");
        return response.json();
      });

      //alert when we upload a photo
      Swal.fire(
        "Success",
        "Profile photo has been uploaded successfully.",
        "success"
      );
    }

    //additional functionality of clicking on uplaod your photo text
    uploadText.addEventListener("click", function () {
      file.click();
    });
  });

  var url_string = window.location.href;
  var url = new URL(url_string);

  var studentid = url.searchParams.get("student_id");
  var firstNameParam = url.searchParams.get("firstName");
  var middleNameParam = url.searchParams.get("middleName");
  var lastNameParam = url.searchParams.get("lastName");
  var mobileNumberParam = url.searchParams.get("mobileNumber");

  if (studentid) {
    fetch(`http://dev-join.navgurukul.org/api/students/${studentid}`)
      .then((response) => response.json())
      .then((data) => {
        //for name field
        const full_name = data.data[0].name.split(" ");
        if (full_name) {
          if (full_name[0]) {
            document.getElementById("firstName").value = full_name[0];
            document.getElementById("firstName").readOnly = true;
          }
          if (full_name.length > 2) {
            document.getElementById("middleName").value = full_name[1];
            document.getElementById("middleName").readOnly = true;
          }
          if (full_name[full_name.length - 1]) {
            document.getElementById("lastName").value =
              full_name[full_name.length - 1];
            document.getElementById("lastName").readOnly = true;
          }
        }

        //for whatsapp number field
        if (data.data[0].contacts[0].mobile) {
          document.getElementById("mobile1").value =
            data.data[0].contacts[0].mobile;
        }

        //for aapka koi aur mobile number
        if (data.data[0].contacts[0].alt_mobile) {
          document.getElementById("alt_mobile").value =
            data.data[0].contacts[0].alt_mobile;
        }
      });
  } else if (firstNameParam && lastNameParam && mobileNumberParam) {
    var firstNameInput = document.getElementById("firstName");
    var middleNameInput = document.getElementById("middleName");
    var lastNameInput = document.getElementById("lastName");
    var mobileNumberInput = document.getElementById("mobile1");
    if (firstNameInput) {
      firstNameInput.value = firstNameParam;
      firstNameInput.readOnly = true;
    }
    if (middleNameInput) {
      middleNameInput.value = middleNameParam;
      middleNameInput.readOnly = true;
    }
    if (lastNameInput) {
      lastNameInput.value = lastNameParam;
      lastNameInput.readOnly = true;
    }
    if (mobileNumberInput) {
      mobileNumberInput.value = mobileNumberParam;
    }
  }
}

function getCityFromState(state) {
  $("#district").empty();
  $("#district").append("<option> Select District </option>");
  $.ajax({
    url: `https://api.countrystatecity.in/v1/countries/IN/states/${state}/cities`, //API URL
    type: "GET",
    headers: {
      accept: "application/json",
      "X-CSCAPI-KEY":
        "TzZrb2p0emtqa29BOW0zTnpLZHdzOVdjNmlubnRDMmtqOEgxRXpFdw==",
    },
    beforeSend: function () {},
    success: function (response, status) {
      for (var i = 0; i < response.length; i++) {
        $("#district").append(
          "<option value='" +
            response[i]["name"] +
            "'>" +
            response[i]["name"] +
            "</option>"
        );
      }
    },
    error: function (error, status) {},
  });
}

function fetchPartnersDistricts() {
  $.get(
    `${base_url}/partners/enrolmentKey/${window.location.href
      .split("/")
      .pop()}`,
    {},
    (data) => {
      let updateField =
        '<select name="city" id="city" class="col-xs-12 col-sm-6 col-md-6 border border-warning rounded section-1">' +
        '<option value="">Select City</option>';
      if (data && data.data.districts !== null) {
        data.data.districts.map(
          (district) =>
            (updateField =
              updateField +
              "<option value='" +
              district +
              "'>" +
              district +
              "</option>")
        );
        updateField = updateField + "</select>";
        $("#city").replaceWith(updateField);
      }
      if (data && data.data.id === 435) {
        for (let i = 0; i < partner_refer.length; i++) {
          $("#partner_refer").append(
            "<option id='" +
              partner_refer[i] +
              "' value='" +
              partner_refer[i] +
              "'>" +
              partner_refer[i] +
              "</option>"
          );
        }
      } else {
        document.getElementById("partner").style.display = "none";
      }
    }
  ).fail(function (response) {
    var select = document.getElementById("city");
    var otherOpt = document.createElement("option");
    otherOpt.value = "other";
    otherOpt.textContent = "Other";
    select.appendChild(otherOpt);
    document.getElementById("partner").style.display = "none";
  });
}

function personal_details_submit() {
  var firstName = $("#firstName").val();
  var middleName = $("#middleName").val();
  var lastName = $("#lastName").val();
  var date = $("#date").val();
  var month = $("#month").val();
  var year = $("#year").val();
  var mobile1 = $("#mobile1").val();
  var mobile2 = $("#mobile2").val();
  var gender = $("#gender").val();
  var state = $("#state").val();
  var district = $("#district").val();
  var pin_code = $("#pin_code").val();
  var city = $("#city").val();
  var email = $("#email").val();
  var partner_refer = $("#partner_refer").val();
  // if (city === "other") {
  //   city = $("#city_or_village_2").val();
  // }

  // if (DEBUG) {
  //     name = "abhishek";
  //     date = "28";
  //     month = "02";
  //     year = "1992";
  //     mobile = "7896121314";
  //     gender = "male";
  //     positions = {
  //         "latitude": 22,
  //         "longitude": 77
  //     }
  // }

  // network_speed.value  = navigator.connection.downlink;

  if (!mobile1) {
    appending("<h4> Kripaya mobile number dijye! </h4>");
    return false;
  }
  if (mobile1.length < 10 || mobile1.length > 10) {
    appending("<h4> 10 digit ka mobile number daliye! </h4>");
    return false;
  }

  if (!firstName) {
    appending("<h4> Kripaya apna firstName batayie! </h4>");
    return false;
  } else if (firstName.length < 3) {
    appending(
      "<h4> Aapka firstName at least 3 characters se lamba hona chahiye!</h4>"
    );
    return false;
  }
  if (/^[a-zA-Z]$/i.test(firstName)) {
    appending(
      '<h4> firstName wale section me (1,.,!,#,@,") ka istamal na kare! </h4>'
    );
    return false;
  }
  if (!lastName) {
    appending("<h4> Kripaya apna lastName batayie! </h4>");
    return false;
  } else if (lastName.length < 3) {
    appending(
      "<h4> Aapka lastName at least 3 characters se lamba hona chahiye!</h4>"
    );
    return false;
  }
  if (/^[a-zA-Z]$/i.test(lastName)) {
    appending(
      '<h4> lastName wale section me (1,.,!,#,@,") ka istamal na kare! </h4>'
    );
    return false;
  }
  // to check that date field isn't empty
  if (date == "") {
    appending("<h4> Kripaya Apne Janam Ka Din Chuniye! </h4>");
    return false;
  } else if (month == "") {
    appending("<h4> Kripaya Apne Janam Ka Mahina Chuniye! </h4>");
    return false;
  } else if (year == "") {
    appending("<h4> Kripaya Apne Janam Ka Saal Chuniye! </h4>");
    return false;
  } else if (gender == "NONE") {
    appending("<h4>Apna gender select kijye! </h4>");
    return false;
  }
  //   if (gender == "male") {
  //     appending("<h4>Boys ke liye admission open nahi hai </h4>");
  //     return false;
  //   }
  if (!state || state == "NONE") {
    appending("Apna State Select karo!");
    return false;
  }

  const isValidEmail =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email && isValidEmail.test(email) === false) {
    appending("Email sahi nahi hai");
    return false;
  }
  if (!district) {
    appending("Apni District ya Village ka naam enter karo!");
    return false;
  }
  if (!city) {
    appending("Kripaya city  dijye!");
    return false;
  }
  if (/^([a-zA-Z0-9]|\s)+$/i.test(city) === false) {
    appending('City ya Village ke naam mein (.,!,#,@,") ka use na kare!');
    return false;
  }

  if (!pin_code || pin_code.length < 6 || pin_code.length > 6) {
    appending("Sahi Pin Code enter kijiye!");
    return false;
  }

  var dob = year + "-" + month + "-" + date;
  var mdob = year + "-" + month + "-" + date + "T00:00:00";
  var name = `${firstName} ${middleName} ${lastName}`;

  var obj = {
    name: name,
    whatsapp: mobile1,
    gender: gender,
    dob: dob,
    state: state,
    district: district,
    city: city ? city : undefined,
    pin_code: pin_code,
    email: email ? email : undefined,
    alt_mobile: mobile2 ? mobile2 : undefined,
    gps_lat: positions ? positions.latitude : -1,
    gps_long: positions ? positions.longitude : -1,
    partner_refer: partner_refer ? partner_refer : undefined,
  };
  mixpanel.identify(mobile1);

  mixpanel.people.set({
    $name: name,
    $phone: mobile1,
    $alt_mobile: mobile2,
    $gender: gender,
    $dob: mdob,
    $state: state,
    $district: district,
    $city: city,
    $pin_code: pin_code,
    $email: email,
  });
  // try {
  //   Sentry.configureScope((scope) => {
  //     scope.setUser({ username: mobile });
  //   });
  // } catch (e) {}
  $.post(
    base_url + "/on_assessment/details/" + enrolment_key,
    obj,
    (data, resp) => {
      mixpanel.track("Personal Details Submitted");

      $("#personal_details").slideUp(slide_up_time);
      $("#time_aware").slideDown(slide_down_time);
      appending("");
      // fetch question and options after filling basic details of student.
      fetchQuestionsAndOptions();
    },
    "json"
  ).fail(function (response) {
    mixpanel.track("Error in Personal Details Submission");
    // try {
    //   Sentry.captureException(response);
    // } catch (e) {}
  });
}

function submitApp() {
  appending("");

  // var pin_code = $("#pin_code").val();
  // var state = $("#state").val();
  // var city = $("#city_or_village").val();
  // if (city === "other") {
  //   city = $("#city_or_village_2").val();
  // }
  var qualification = $("#qualification").val();
  var current_status = $("#current_status").val();
  var school_medium = $("#school_medium").val();
  var caste = $("#caste").val();
  var religion = $("#religion").val();
  var percentage_in12th = $("#percentage_in12th").val();
  var percentage_in10th = $("#percentage_in10th").val();
  var math_marks_in10th = $("#math_marks_in10th").val();
  var math_marks_in12th = $("#math_marks_in12th").val();

  var academicDetails = {};
  if (DEBUG) {
    pin_code = 110010;
    qualification = "lessThan10th";
    state = "AN";
    city = "Gurgaon";
    current_status = "job";
    school_medium = "en";
    caste = "scSt";
    religion = "hindu";
  }

  // if (!pin_code || pin_code.length < 6 || pin_code.length > 6) {
  //   appending("Sahi Pin Code enter kijiye!");
  //   return false;
  // }

  // if (!state || state == "NONE") {
  //   appending("Apna State Select karo!");
  //   return false;
  // }

  // if (!city) {
  //   appending("Apni City ya Village ka naam enter karo!");
  //   return false;
  // }

  // if (/^[a-zA-Z]$/i.test(city)) {
  //   appending('City ya Village ke naam mein (1,.,!,#,@,") ka use na kare!');
  //   return false;
  // }

  if (!current_status || current_status == "NONE") {
    appending("Apne current status ko select karo!");
    return false;
  }

  if (!qualification || qualification == "NONE") {
    appending("Qualification select karo!");
    return false;
  }

  if (!school_medium || school_medium == "NONE") {
    appending("Apne last school ka medium select karo!");
    return false;
  }

  if (!caste || caste == "NONE") {
    appending("Apni caste select karo!");
    return false;
  }

  if (!religion || religion == "NONE") {
    appending("Apna religion select karo!");
    return false;
  }

  qualification = $("#qualification").children("option:selected").val();

  if (qualification == "class10th") {
    if (!percentage_in10th) {
      appending("Apke 10th ke percentage dijye!");
      return false;
    }

    academicDetails = {
      math_marks_in10th: math_marks_in10th,
      percentage_in10th: percentage_in10th,
    };
  } else if (qualification == "class12th" || qualification == "graduate") {
    if (!percentage_in10th) {
      appending("Apke 10th ke percentage dijye!");
      return false;
    }

    if (!percentage_in12th) {
      appending("Apke 12th ke percentage dijye!");
      return false;
    }

    academicDetails = {
      math_marks_in10th: math_marks_in10th,
      percentage_in10th: percentage_in10th,
      math_marks_in12th: math_marks_in12th,
      percentage_in12th: percentage_in12th,
    };
  } else if (qualification == "lessThan10th") {
    // Do nothing for now
  }

  var obj = {
    qualification: qualification,
    current_status: current_status,
    school_medium: school_medium,
    caste: caste,
    religon: religion,
  };

  obj = Object.assign(obj, academicDetails);

  var mixpanelObj = {};
  var objKeys = Object.keys(obj);

  for (var i = 0; i < objKeys; i++) {
    var key = objKeys[i];
    mixpanelObj["$" + key] = obj[key];
  }

  mixpanel.people.set(mixpanelObj);

  $.post(
    base_url + "/on_assessment/details/" + enrolment_key,
    obj,
    (data, resp) => {
      $(".page").hide();
      $("#end_page").slideDown(slide_down_time);
      show_TestResult();
      mixpanel.track("Thank You");
    },
    "json"
  ).fail(function (response) {
    mixpanel.track("Error in Submission of final details");
    // try {
    //   Sentry.captureException(response);
    // } catch (e) {}
  });
}

function time_aware_submit() {
  // show question_answer_page page
  $("#time_aware").slideUp(slide_up_time);
  $("#question_answer_page").slideDown(slide_down_time);

  mixpanel.track("Question 1");

  var data;
  var last_recorded_time = new Date().getTime();
  var total_time = DEBUG ? 1000 : 5400;
  var time_remaining = total_time;

  do_it = setInterval(function () {
    new_time = new Date().getTime();
    time_spent = (new_time - last_recorded_time) / 1000;
    last_recorded_time = new_time;
    time_remaining -= time_spent;

    time_to_show = time_remaining;

    minutes = Math.floor(time_to_show / 60);
    seconds = Math.round(time_to_show % 60);

    $(".progress-bar").css({
      width: (time_remaining * 100) / total_time + "%",
    });

    if (time_remaining <= 1) {
      $("#time_to_show").html("<h4>Time Over Submitting Your Test Now.</h4>");
      submitTest();
      $(".progress").hide();
      clearInterval(do_it);
    } else if (time_remaining <= 15) {
      msg =
        "<h4>Time Over Submitting Your Test Now " +
        ".".repeat((Math.floor(time_remaining) % 4) + 1) +
        " </h4>";
      $("#time_to_show").html(msg);
    } else {
      $("#time_to_show").html(
        "Time Remaining: " + minutes + " minutes " + seconds + " seconds."
      );
    }
  }, 1000);

  // $.post("/test/start_test/"+enrolment_key,
  //     {},
  //     function(data, resp) {
  //         data = data;
  //     }
  // );
}

function nextQuestion() {
  updateAnswer(current_question);
  mixpanel.track("Next " + current_question);
  current_question += 1;
  displayQuestion(current_question);
}

function previousQuestion() {
  updateAnswer(current_question);
  mixpanel.track("Previous " + current_question);
  current_question -= 1;
  displayQuestion(current_question);
}

function updateAnswer(index) {
  if (questions[index]["type"] == 1) {
    answers[questions[index]["id"]] = $("#qmcq .option button.active").attr(
      "data-id"
    );
  } else {
    answers[questions[index]["id"]] = $("#qinteger_answer input").val();
  }
  return true;
}

function showAnswer(index) {
  if (dirty_answers[index] == -1) {
    dirty_answers[index] = 0;

    mixpanel.track("Question " + index);

    $("#qmcq .option button.active").removeClass("active");
    $("#qinteger_answer input").val("");
  } else if (questions[index]["type"] == 1) {
    $("#qmcq .option button").each(function (i, obj) {
      if ($(this).attr("data-id") == answers[questions[index]["id"]]) {
        $(this).addClass("active");
      } else {
        $(this).removeClass("active");
      }
    });
  } else {
    $("#qinteger_answer input").val(answers[questions[index]["id"]]);
  }
  return true;
}

function kitne_kar_liye(answers) {
  var itne_kar_liye = 0;
  var keys = Object.keys(answers);
  for (var i = 0; i < keys.length; i++) {
    if ((answers[keys[i]] != undefined) & (answers[keys[i]] != "")) {
      itne_kar_liye++;
    }
  }
  return itne_kar_liye;
}

function displayQuestion(index) {
  $("#on_question").html(
    "Yeh Question no. <b>" +
      (index + 1) +
      "</b> (out of <b>" +
      questions.length +
      "</b> questions)"
  );
  $("#kitne_questions").html(
    "Aapne <b>" +
      kitne_kar_liye(answers) +
      "</b> questions already attempt kar liye hai!"
  );

  if (index == 1) {
    $("#prev_button").show("slow");
  } else if (index == 0) {
    $("#prev_button").hide("slow");
  }

  if (index == questions.length - 1) {
    //i am at last question
    $("#next_btn").hide("slow");
    $("#submit_btn").show("slow");
  } else {
    $("#next_btn").show("slow");
    $("#submit_btn").hide("slow");
  }

  if (index >= questions.length) {
    $("#btn_next_submit").hide("slow");
    return "HO GAYA :D";
  } else {
    //display question with index index
    var question = questions[index];
    if (question["type"] == 1) {
      // $('#qmcq').slideUp(slide_up_time);
      $("#qinteger_answer").slideUp(slide_up_time);
      $("#qmcq").slideDown(slide_down_time);
      $("#qmcq .qtext").html(getQuestion(question));
      var options = question["options"];
      var options_html = "";

      for (var i = 0; i < options.length; i++) {
        //button
        // options[i]["id"]
        options_html +=
          `<div class="option col-6 text-center mt-2"> \
                <button type="button" class="btn btn-outline-info" data-id="` +
          options[i]["id"] +
          `" onclick="makeActive(` +
          i +
          `)">` +
          options[i]["text"] +
          `</div>`;

        // <input type="radio" value="B or C" name="answer_1"  \
        // id="id_10" class="cls_1"/> \
        //     <label class="answer-label" for="id_10">`
      }

      $("#qmcq .options").html(options_html);
    } else if (question["type"] == 2) {
      $("#qmcq").slideUp(slide_up_time);
      // $('#qinteger_answer').slideUp(slide_up_time);
      $("#qinteger_answer").slideDown(slide_down_time);
      $("#qinteger_answer .qtext").html(getQuestion(question));
    } else {
      console.log("YEH KAHA AA GAYE HUM, YUHI SERVER PAR TRUST KARTE KARTE!");
      //        displayQuestion(index+1);
    }
  }

  showAnswer(index);
}

function makeActive(index) {
  $("#qmcq .option button").each(function (i, obj) {
    if (i == index) {
      $(this).addClass("active");
    } else {
      $(this).removeClass("active");
    }
  });
}

function show_thanksPage() {
  $(".page").hide();
  $("#thank_you_page").show();
}
function show_TestResult() {
  $.get(
    base_url + "/on_assessment/Show_testResult/" + enrolment_key,
    {},
    (data, resp) => {
      testMarks = data["total_marks"];
      if (data["Result"] === "Passed") {
        $(".page").hide();
        $("#test_pass").slideDown(slide_down_time);
        $("#language_select").show();
        $("#test_pass .marks").html(testMarks);
      }
      // If students Failed in test.
      if (data["Result"] == "Failed") {
        $(".page").hide();
        $("#test_fail").slideDown(slide_down_time);
        $("#language_select").show();
        $("#test_fail .marks").html(testMarks);
      }
    }
  ).fail(function (response) {
    $("#myModal").modal();
    // try {
    //   Sentry.captureException(response);
    // } catch (e) {}
  });
}

function visit_website() {
  mixpanel.track("Visit NG Website");
  window.location.href = "http://navgurukul.org";
}

function learn_coding() {
  mixpanel.track("Visit SARAL");
  window.location.href = "http://saral.navgurukul.org";
}
function submitTest() {
  for (let key of Object.keys(answers)) {
    if (answers[key] === undefined) {
      answers[key] = "";
    }
  }
  updateAnswer(current_question);
  $.ajax({
    url: base_url + "/on_assessment/questions/" + enrolment_key + "/answers",
    type: "POST",
    data: JSON.stringify(answers),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (data, resp) {
      $("#question_answer_page").slideUp(slide_up_time);
      $("#end_page").slideDown(slide_down_time);
      mixpanel.track("Answers Submitted");
    },
    error: function (error) {
      mixpanel.track("Error in Answers Submission");
      // try {
      //   Sentry.captureException(error);
      // } catch (e) {}
    },
  });
}

$(document).ready(function () {
  fetchState();
  getInfo();
  fetchPartnersDistricts();
  if (!DEBUG) {
    // landing_page_submit();
    // personal_details_submit();
    // time_aware_submit();
  }
  // else {
  $.get(
    base_url + "/on_assessment/validate_enrolment_key/" + enrolment_key,
    {},
    (data, resp) => {
      if (data["keyStatus"] == "testAnswered") {
        $(".page").hide();
        $("#end_page").show();
      }
      // If students stage is basicDetailsEntered then hide personal_details div.
      if (data["stage"] == "basicDetailsEntered") {
        $(".page").hide();
        $("#time_aware").slideDown(slide_down_time);
        $("#language_select").show();
        // fetch direct questions and options.
        fetchQuestionsAndOptions();
      }
      // once student is enter hes complete details then hide end_page it is related to final students details.
      if (
        data["stage"] == "pendingEnglishInterview" ||
        data["stage"] == "testFailed"
      ) {
        $(".page").hide();
        $("#thank_you_page").slideDown(slide_down_time);
      }
    }
  ).fail(function (response) {
    $("#myModal").modal();
    // try {
    //   Sentry.captureException(response);
    // } catch (e) {}
  });
  // }
});

$(function () {
  $(".lang").hide();
  $(".lang.hi").show();

  $("#choose_language").change(function () {
    current_language = $(this).children("option:selected").val();
    $(".lang").hide();
    $(".lang." + current_language).show();
    $("#lang_choice").val(current_language);
  });

  $("#qualification").change(function () {
    qualification = $(this).children("option:selected").val();
    if (qualification == "lessThan10th") {
      $(".pass10").hide();
      $(".pass12").hide();
    } else if (qualification == "class10th") {
      $(".pass10").show();
      $(".pass12").hide();
    } else if (qualification == "class12th" || qualification == "graduate") {
      $(".pass10").show();
      $(".pass12").show();
    }
  });
});

function selectLanguage() {
  mixpanel.track("Language selector");
  $("#select_language").slideUp(slide_up_time);
  $("#landing_page").slideDown(slide_down_time);
  $("#language_select").show();
}

function languageSelector() {
  current_language = $("#lang_choice").children("option:selected").val();
  $(".lang").hide();
  $(".lang." + current_language).show();
  displayQuestion(current_question);
}

function selectOther() {
  var partner_refer = $("#partner_refer").val();
  if (partner_refer === "Others") {
    $("#partner_refer").replaceWith(
      '<input type="text" name="city" id="city" placeholder="Partner Name" class="col-xs-12 col-sm-6 col-md-6 border border-warning rounded section-1" />'
    );
  }
}
