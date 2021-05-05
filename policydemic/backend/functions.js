const { Client } = require('@elastic/elasticsearch')
const client = new Client({node: 'http://elastic:9200'})

async function autocompleteField(field) {

    const results = await client.search({
        index: 'documents',
        body: {
             "size":"0",
             "aggs" : {
               "unique" : {
               "terms" : { "field" : field, "size": 1000 }
               }
             }
        }
    })
    
    unique_values = results.body.aggregations.unique.buckets
    return unique_values.map((row)=>({name: row.key, value:row.key}))
}

async function autocompleteCountry(type) {

    const results = await client.search({
        index: 'documents',
        body: {
             "size":"0",
             "aggs" : {
               "unique" : {
               "terms" : { "field" : "country", "size": 1000 }
               }
             },
            "query": {
                "bool": {
                    "must": {
                        "match": {
                            "document_type": type
                        }
                    }
                }
            }        
        }
    })

    unique_values = results.body.aggregations.unique.buckets
    return unique_values.map((row)=>({name: row.key, value:row.key}))
}

async function getDocuments(ctx, documentType) {
    const data = await fetchDocumentsFromElastic(ctx.request.body, documentType)
        .catch(console.log)
        .then(resp => {
            ctx.body = parseData(resp);
            ctx.status = 200
        }, error => {
            console.log("Error " + error)
        })
}

function parseData(data){
    const parsedData = [];
    if (!data) data = [];
    data.forEach(element => {
        const k = element._source.keywords
        parsedData.push({
            title: element._source.title,
            section: element._source.section,
            organization: element._source.organization,
            id: element._id,
            info_date: element._source.info_date,
            country: element._source.country,
        })
    });
    return parsedData;
}

async function fetchDocumentsFromElastic(body, documentType){

    let params = constructParams(body, documentType)
    let request = await client.search(params);
    return request.body.hits.hits;
}

function constructParams(body, documentType){
    
    const documentFilter = []

    if (body.infoDateTo && body.infoDateFrom && body.infoDateTo.length > 0 && body.infoDateFrom.length > 0) {
        documentFilter.push( {
            "bool": {
                "must": {
                    "range": {
                        "info_date": {
                            "gte": body.infoDateFrom,
                            "lte": body.infoDateTo
                        }
                    }

                }
            } 
        },  {
            "bool": {
                "must": [{
                        "range": {
                            "info_date": {
                                "gte": "1900-01-01",
                                "lte": "1900-01-01"
                            }
                        }
                    },
                    {
                        "range": {
                            "scrap_date": {
                                "gte": body.infoDateFrom + " 00:00:00",
                                "lte": body.infoDateTo + " 23:59:59"
                            }
                        }
                    }
                ]
                }
            }
        )
    }
    
    let params = {
        index: 'documents',
        body: {
            query: {
                bool: {
                    must: [
                        {match: {
                            document_type: documentType
                            }
                        },
                        {
                            bool: {
                                should: documentFilter
                            }
                        }
                    ]
                }
            }
        }, 
        size: 100
    }


    let fields = ["country", "section", "organization", "status"];

    for(let i = 0; i < fields.length; i++){

        if (body[fields[i]] && body[fields[i]].length > 0) {

            let boolStatement = {
                bool: {
                    should: []
                }
            };
            for( let j=0; j<body[fields[i]].length; j++) {

                let matchStatement = {
                    match: ""
                };
                let fieldStatement = {};

                fieldStatement[fields[i]] = body[fields[i]][j]
                matchStatement["match"] = fieldStatement
                boolStatement.bool.should.push(matchStatement)
            }

            params.body.query.bool.must.push(boolStatement)
            }
        }

    if (body["keywords"] == undefined) {
        body["keywords"] = [""]
    } else {
        body["keywords"] = body["keywords"][0].split(" ")
    }
    if (body["keywords"] && body["keywords"].length > 0) {

        let boolStatement = {
            bool: {
                should: []
            }
        };
        for( let j=0; j<body["keywords"].length; j++) {

            let matchStatement = {
                match_phrase: ""
            };
            let fieldStatement = {};

            matchStatement["match_phrase"] = {"original_text": {
                                        "query": body["keywords"][j],
                                        "zero_terms_query": "all"
                                        }
                                    }
            boolStatement.bool.should.push(matchStatement)
        }

        params.body.query.bool.must.push(boolStatement)
    } 

    return params
}

async function postDocument(ctx){
    const body = { ...ctx.request.body }

    await client.index({
        index: 'documents',
        body: {
            doc: body
        }
    })    
}

async function updateDocument(ctx){
    
    const body = { ...ctx.request.body }

    await client.update({
        index: 'documents',
        id: ctx.params.id,
        body: {
            doc: body
        }
    })
}

module.exports = {
    autocompleteField,
    autocompleteCountry,
    getDocuments,
    parseData,
    fetchDocumentsFromElastic,
    constructParams,
    postDocument,
    updateDocument
}