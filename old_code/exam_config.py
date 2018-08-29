import html_strings

config = {
"question_config" :{
    "set_3":{
                "info_before":{
                    "html": html_strings.mix_mcqs.before,
                    "time_in_seconds": 60
                },
                "questions":{
                    "categories":{
                        "BASIC-MATH":{ "easy":3, "medium":3, "hard":3 },
                        "ABSTRACT-REASONING":{ "easy":2, "medium":2, "hard":2 },
                        "NON-VERBAL-LOGICAL-REASONING":{ "easy":1, "medium":1, "hard":1 },
                    },
                    "marks_config" :{
                        "easy":(1,0),
                        "medium":(2,0),
                        "hard":(3,0)
                    },
                    "time_per_question":200,
                },
                "info_after":{
                    "html": html_strings.generic.after,
                    "time_in_seconds": 10
                }
            },
    },
    "test_config":{
            "test_time": 3600+70,
            "set_3": 3600+70, #18*200 +60 +10
            "passing_marks":17, # more than equal to 17 is pass
    }
}
