import html_strings

config = {
"question_config" :{
    "set_1":{
                "info_before":{
                    "html": html_strings.old_test.before,
                    "time_in_seconds": 60
                },
                "questions":{ 
                    "categories":{
                        "pattern matching":{ "easy":4, "medium":0, "hard":0 },
                        "simple logic":{ "easy":3, "medium":0, "hard":0 },
                        "dependency maths":{ "easy":1, "medium":0, "hard":0 },
                        "numerical prophicency":{ "easy":2, "medium":0, "hard":0 },
                    },
                    "marks_config" :{
                        "easy":(1,0),
                        "medium":(2,0),
                        "hard":(3,0)
                    },
                    "time_per_question":60,
                },
                "info_after":{
                    "html": html_strings.generic.after,
                    "time_in_seconds": 60
                }
            }
    },
    "test_config":{
                    "test_time":12*60,
                    "set_1":12*60
    }
}
