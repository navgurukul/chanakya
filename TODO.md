# Chanakya To-Dos

List of todos which still need to be complteted.

1. Data Validations on the form & backend (@shanu)
2. Student states implementation (@shanu)\
3. Data zipping (@shanu)
4. Check out `Student State Tracking`. Need to implement a table where the student records can be created whenever a web hook is called. (@rishabh)
5. Check otu `Student State Tracking`. Need to implement a way student stage changes can be tracked on basis of time. Our system would know of stage changes whenever a web hook is called. These stage changes can also be seen using a web URL by the student by putting in their enrolment number. (@rishabh)
6. write integration tests, functional tests and unit tests (in @shanu's dreams)
7. session expiry policy (@shanu)
8. 5-min test (@shanu)
9. on submit popup and previous button in test (@shanu)
10. url for student result (@shanu)




## Student State Tracking
Students need to be sent notifications whenever their stage in the onboarding process changes from x to y. Example a student who is currently at the Lightbot stage should be called and when his stage shifts to Interview. For this we need to track the stage of the student whenever his record is created. Then we can send a web hook request whenever the stage changes and keep the complete record on our side too. This will also help him show his latest status using the enrolment number. (@rishabh)