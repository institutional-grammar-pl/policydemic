const {constructParams} = require('./functions')

describe('Creation of queries tests', function () {

    it('When no data provided in request body query consist only of dates, document type and empty match_phrase query', function () {

        let bodyRequest = {
            "infoDateFrom": "2020-01-01",
            "infoDateTo": "2021-01-01"
        };

        let expectedQuery = {
            "index": "documents",
            "body": {
                "query": {
                    "bool": {
                        "must": [{
                                "match": {
                                    "document_type": "legal_act"
                                }
                            },
                            {
                                "bool": {
                                    "should": [{
                                        "bool": {
                                            "must": {
                                                "range": {
                                                    "info_date": {
                                                        "gte": "2020-01-01",
                                                        "lte": "2021-01-01"
                                                    }
                                                }
                                            }
                                        }
                                    }, {
                                        "bool": {
                                            "must": [{
                                                "range": {
                                                    "info_date": {
                                                        "gte": "1900-01-01",
                                                        "lte": "1900-01-01"
                                                    }
                                                }
                                            }, {
                                                "range": {
                                                    "scrap_date": {
                                                        "gte": "2020-01-01 00:00:00",
                                                        "lte": "2021-01-01 23:59:59"
                                                    }
                                                }
                                            }]
                                        }
                                    }]
                                }
                            },
                            {
                                "bool": {
                                    "should": [{
                                        "match_phrase": {
                                            "original_text": {
                                                "query": "",
                                                "zero_terms_query": "all"
                                                }
                                            }
                                        }]
                                    }
                            }
                        ]
                    }
                }
            },
            "size": 100
        };

        let result = constructParams(bodyRequest, "legal_act");
        expect(result).toStrictEqual(expectedQuery);
    });

    it('When one of each parameters is provided query contains one value for every key', function () {

        let bodyRequest = {
            "country": ["Poland"],
            "keywords":["school"],
            "status": ["subject_accepted"],
            "infoDateFrom": "2020-01-01",
            "infoDateTo": "2021-01-01"
        };

        let expectedQuery = {
            "index": "documents",
            "body": {
                "query": {
                    "bool": {
                        "must": [{
                            "match": {
                                "document_type": "legal_act"
                            }
                        }, {
                            "bool": {
                                "should": [{
                                    "bool": {
                                        "must": {
                                            "range": {
                                                "info_date": {
                                                    "gte": "2020-01-01",
                                                    "lte": "2021-01-01"
                                                }
                                            }
                                        }
                                    }
                                }, {
                                    "bool": {
                                        "must": [{
                                            "range": {
                                                "info_date": {
                                                    "gte": "1900-01-01",
                                                    "lte": "1900-01-01"
                                                }
                                            }
                                        }, {
                                            "range": {
                                                "scrap_date": {
                                                    "gte": "2020-01-01 00:00:00",
                                                    "lte": "2021-01-01 23:59:59"
                                                }
                                            }
                                        }]
                                    }
                                }]
                            }
                        }, {
                            "bool": {
                                "should": [{
                                    "match": {
                                        "country": "Poland"
                                    }
                                }]
                            }
                        }, {
                            "bool": {
                                "should": [{
                                    "match": {
                                        "status": "subject_accepted"
                                    }
                                }]
                            }
                        },
                            {
                            "bool": {
                                "should": [{
                                    "match_phrase": {
                                        "original_text": {
                                            "query": "school",
                                            "zero_terms_query": "all"
                                            }
                                        }
                                    }]
                                }
                            }
                        ]
                    }
                }
            },
            "size": 100,
        };

        let result = constructParams(bodyRequest, "legal_act");
        expect(result).toStrictEqual(expectedQuery);

    });

    it('When multiple values are passed for one of the parameters query should have multiple match queries enclosed in should clause', function () {
        let bodyRequest = {
            "country": ["Poland", "Italy", "Spain"],
            "keywords": ["school work"],
            "infoDateFrom": "2020-01-01",
            "infoDateTo": "2021-01-01",
            "status": ["subject_accepted"]
        };

        let expectedQuery = {
            "index": "documents",
            "body": {
                "query": {
                    "bool": {
                        "must": [{
                            "match": {
                                "document_type": "legal_act"
                            }
                        }, {
                            "bool": {
                                "should": [{
                                    "bool": {
                                        "must": {
                                            "range": {
                                                "info_date": {
                                                    "gte": "2020-01-01",
                                                    "lte": "2021-01-01"
                                                }
                                            }
                                        }
                                    }
                                }, {
                                    "bool": {
                                        "must": [{
                                            "range": {
                                                "info_date": {
                                                    "gte": "1900-01-01",
                                                    "lte": "1900-01-01"
                                                }
                                            }
                                        }, {
                                            "range": {
                                                "scrap_date": {
                                                    "gte": "2020-01-01 00:00:00",
                                                    "lte": "2021-01-01 23:59:59"
                                                }
                                            }
                                        }]
                                    }
                                }]
                            }
                        }, {
                            "bool": {
                                "should": [{
                                    "match": {
                                        "country": "Poland"
                                    }
                                }, {
                                    "match": {
                                        "country": "Italy"
                                    }
                                }, {
                                    "match": {
                                        "country": "Spain"
                                    }
                                }]
                            }
                        }, {
                            "bool": {
                                "should": [{
                                    "match": {
                                        "status": "subject_accepted"
                                    }
                                }]
                            }
                        }, {
                            "bool": {
                                "should": [{
                                    "match_phrase": {
                                        "original_text": {
                                            "query": "school",
                                            "zero_terms_query": "all"
                                        }
                                    }
                                }, {
                                    "match_phrase": {
                                        "original_text": {
                                            "query": "work",
                                            "zero_terms_query": "all"
                                        }
                                    }
                                }]
                            }
                        }]
                    }
                }
            },
            "size": 100
        }

        let result = constructParams(bodyRequest, 'legal_act');

        expect(result).toStrictEqual(expectedQuery);

    });


    it('When secondary document type is provided query will look for secondary document type', function () {

        let bodyRequest = {
            "infoDateFrom": "2020-01-01",
            "infoDateTo": "2021-01-01"
        };
        let expectedQuery = {
                "index": "documents",
                "body": {
                    "query": {
                        "bool": {
                            "must": [{
                                    "match": {
                                        "document_type": "secondary_source"
                                    }
                                },
                                {
                                    "bool": {
                                        "should": [{
                                            "bool": {
                                                "must": {
                                                    "range": {
                                                        "info_date": {
                                                            "gte": "2020-01-01",
                                                            "lte": "2021-01-01"
                                                        }
                                                    }
                                                }
                                            }
                                        }, {
                                            "bool": {
                                                "must": [{
                                                    "range": {
                                                        "info_date": {
                                                            "gte": "1900-01-01",
                                                            "lte": "1900-01-01"
                                                        }
                                                    }
                                                }, {
                                                    "range": {
                                                        "scrap_date": {
                                                            "gte": "2020-01-01 00:00:00",
                                                            "lte": "2021-01-01 23:59:59"
                                                        }
                                                    }
                                                }]
                                            }
                                        }]
                                    }
                                },
                                {
                                    "bool": {
                                        "should": [{
                                            "match_phrase": {
                                                "original_text": {
                                                    "query": "",
                                                    "zero_terms_query": "all"
                                                    }
                                                }
                                            }]
                                        }
                                }
                            ]
                        }
                    }
                },
                "size": 100
            };


        let result = constructParams(bodyRequest, "secondary_source")

        expect(result).toStrictEqual(expectedQuery)
    }) 
})
