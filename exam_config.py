import html_strings

config = {
"question_config" :{
    "set 1":{
                "info_before":{
                    "html": html_strings.set_1.before,
                    "time_in_seconds": 50
                },
                "questions":{ 
                    "categories":{
                        "category-1":{ "easy":1, "medium":2, "hard":2 },
                        "category-2":{ "easy":1, "medium":1, "hard":1 }
                    },
                    "marks_config" :{
                        "easy":(1,0),
                        "medium":(2,0),
                        "hard":(3,0)
                    },
                    "time_per_question":10,
                },
                "info_after":{
                    "html": html_strings.set_1.after,
                    "time_in_seconds": 30
                }
            },
    "set 2":{
                "info_before":{
                    "html": html_strings.set_2.before,
                    "time_in_seconds": 45
                },
                "questions":{ 
                    "categories":{
                        "category-3":{ "easy":1, "medium":2, "hard":2 },
                        "category-4":{ "easy":1, "medium":1, "hard":1 }
                    },
                    "marks_config" :{
                        "easy":(1,0),
                        "medium":(2,0),
                        "hard":(3,0)
                    },
                    "time_per_question":10,
                },
                "info_after":{
                    "html": html_strings.set_2.after,
                    "time_in_seconds": 30
                }
            }
    },
    "test_config":{
                    "test_time":160 + 155
    }
}
