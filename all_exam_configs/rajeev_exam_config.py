import html_strings

config = {
"question_config" :{
    "set_1":{
                "info_before":{
                    "html": html_strings.memory.before,
                    "time_in_seconds": 90
                },
                "questions":{ 
                    "categories":{
                        "memory":{ "easy":1, "medium":1, "hard":1 },
                    },
                    "marks_config" :{
                        "easy":(1,0),
                        "medium":(2,0),
                        "hard":(3,0)
                    },
                    "time_per_question":30,
                },
                "info_after":{
                    "html": html_strings.generic.after,
                    "time_in_seconds": 10
                }
            },
    "set_2":{
                "info_before":{
                    "html": html_strings.processing.before,
                    "time_in_seconds": 30
                },
                "questions":{ 
                    "categories":{
                        "processing":{ "easy":36, "medium":0, "hard":0 },
                    },
                    "marks_config" :{
                        "easy":(1,0),
                        "medium":(2,0),
                        "hard":(3,0)
                    },
                    "time_per_question":10,
                },
                "info_after":{
                    "html": html_strings.generic.after,
                    "time_in_seconds": 10
                }
            },
    "set_3":{
                "info_before":{
                    "html": html_strings.mix_mcqs.before,
                    "time_in_seconds": 30
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
                    "time_per_question":60,
                },
                "info_after":{
                    "html": html_strings.generic.after,
                    "time_in_seconds": 10
                }
            },
    },
    "test_config":{
            "test_time": 1710,
            "set_1": 1520 + 190, #1710
            "set_2": 1120 + 36*10 + 30 +10, #1120 + 400 =  1520
            "set_3": 1120, #18*60 +30 +10
    }
}
