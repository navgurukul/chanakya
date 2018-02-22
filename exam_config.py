config = {
"question_config" :{
    "set 1":{
                "info_before":{
                    "html": "<h1>Info before set 1 for 60 sec</h1>",
                    "time_in_seconds": 60
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
                    "html": "<h1>info after set 1 for 60 sec</h1>",
                    "time_in_seconds": 60
                }
            },
    "set 2":{
                "info_before":{
                    "html": "<h1>info before set 2 for 15 sec</h1>",
                    "time_in_seconds": 15
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
                    "html": "<h1>info after set 2 for 15 sec</h1>",
                    "time_in_seconds": 15
                }
            }
    },
    "test_config":{
                    #"test_time":60*60 + 5 #1 hour + 5 (for N/W delay and all)
                    "test_time":310 #1 hour + 5 (for N/W delay and all)
    }
}
