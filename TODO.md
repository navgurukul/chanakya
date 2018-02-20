# Chanakya To-Dos

List of todos which still need to be complteted.

1. Data Validations on the form & backend (@shanu)
2. Student states implementation (@shanu)\
3. Data zipping (@shanu)
4. A web hook will be called whenever the stage of a potential student is changed. This web hook can be told to send an SMS, eMail or a Exotel OBD. (@rishabh)
6. session expiry policy (@shanu)
7. 5-min test (@shanu)
8. on submit popup and previous button in test (@shanu)
9. url for student result (@shanu)




## Student State Tracking
Students need to be sent notifications whenever their stage in the onboarding process changes from x to y. Example a student who is currently at the Lightbot stage should be called and when his stage shifts to Interview. For this we need to track the stage of the student whenever his record is created. Then we can send a web hook request whenever the stage changes and keep the complete record on our side too. This will also help him show his latest status using the enrolment number. (@rishabh)