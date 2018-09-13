var enrolment_key = "NTH36";

function appending(error) {
    $('#errors').html('');
    $('#errors').html(error);
}

// for getting lat and long
if (navigator.geolocation){
    navigator.geolocation.getCurrentPosition(function(positions){coordinates = positions.coords.latitude +','+ positions.coords.longitude});
}
else{
    appending('Geolocation not supported!');
}

function page1submit() {
    $("#page1").slideUp(600);
    $("#page2").slideDown(800);
    setupDatePicker();
};

function setupDatePicker() {
    var monthdict ={
        'Jan':"01",'Feb':"02",'Mar':'03','April':"04","May":"05",
        'Jun':"06",'Jul':"07","Aug":"08",'Sep':"09",'Oct':'10',
        'Nov':"11",'Dec':'12', 
    }
    // To get the year
    var today = new Date();
    var yyyy = today.getFullYear()-10;
    minyyyy = yyyy-30;
        
    var datefield = $('#date');
    for (var i = 1 ; i <= 31; i++) {
        datefield.append("<option value="+i+">"+i+"</option>");
    }
    
    var monthfield = $('#month');
    for (var key in monthdict) {
        monthfield.append("<option value="+monthdict[key]+">"+key+"</option>");
    }
    var yearfield = $('#year');
    
    for (var i = minyyyy ; i <= yyyy; i++) {
        yearfield.append("<option value="+i+">"+i+"</option>");
    }    
}

function page2submit() {
    var name = $('#name').val();
    var date = $('#date').val();
    var month = $('#month').val();
    var year = $('#year').val();
    var mobile = $('#mobile').val();
    var gender = $('#gender').val();

    // user_agent.value = navigator.userAgent
    // coords.value = coordinates;
    // network_speed.value  = navigator.connection.downlink;

    if(!mobile && mobile.length>9 && mobile.length < 13){
        appending('Kripaya mobile number dijye!');
        return false;
    }
    if(mobile.length<10 || mobile.length>10){
        appending('10 digit ka mobile number daliye!');
        return false;
    }
    
    if(!name){
        appending('Kripaya apna naam batayie!');
        return false;
    }
    if( /^[a-zA-Z]$/i.test(name)){
        appending('Naam wale section me (1,.,!,#,@,") ka istamal na kare!');
        return false;
    }
    // to check that date field isn't empty
    if(date == ''){
        appending('Kripaya Apne Janam Ka Din Chuniye!');
        return false;
    }
    else if(month == ''){
        appending('Kripaya Apne Janam Ka Mahina Chuniye!');
        return false;
    }
    else if(year == ''){
        appending('Kripaya Apne Janam Ka Saal Chuniye!');
        return false;
    }
    else if(gender == 'NONE'){
        appending('Apna gender select kijye!');
        return false;
    }

    var dob = year +'-'+ month +'-'+date;

    // dob.style.display = 'none';
    // coords.style.display = 'none';
    // network_speed.style.display = "none";
    // user_agent.style.display = "none";
    // form.appendChild(coords);
    // form.appendChild(dob);
    // form.appendChild(network_speed);
    // form.appendChild(user_agent);

    var obj = {
        "name": name,
        "mobile": mobile,
        "gender": gender,
        "dob": dob
    }

    // $.post("/test/personal_details/"+enrolment_key,
    //     // JSON.stringify(obj)
    //     obj,
    //     function(data, resp){
    //         console.log(resp);
    //     }
    // );
}

function page3submit() {

}

function page4submit() {

}

// var form = document.getElementById('ask_personal_details');
// var errors = $('#errors');
