const Koa = require('koa');
const KoaRouter = require('koa-router');
const bodyParser = require('koa-bodyparser');
const multer = require('koa-multer');
const cors = require('@koa/cors');
const fs = require('fs');
const { Client } = require('@elastic/elasticsearch')
const client = new Client({node: 'http:/localhost:9200'})

const app = new Koa();
const router = new KoaRouter();
const upload = multer();

const celery = require('celery-node');

const celery_client = celery.createClient(
  "amqp://",
  "amqp://"
);

const basicAuth = require('basic-auth')
const crypto = require('crypto')

app.use(async (ctx, next) => {
    const user = basicAuth(ctx);
    if (user && user.name === 'root') {
        var shasum = crypto.createHash('sha256');
        shasum.update(`${user.pass}`);
        if (shasum.digest('hex') === 'a15f8ae07675bfb96e084bfb4f52fb2c22091061aae86e0eb76a55f4e52dd74e') {
            return next();
        }
    }

    ctx.status = 401;
    ctx.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    ctx.body = 'Invalid credentials!';
})

router.get('/', (ctx) => {
  ctx.body = "Hello world!"
})

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

router.get('/autocomplete/countries', async (ctx) => {
    ctx.body = await autocompleteField("country")
})


router.get('/autocomplete/languages', async (ctx) => {
    ctx.body = await autocompleteField("language")
})

router.get('/autocomplete/keywords', async (ctx) => {
    ctx.body = await autocompleteField("keywords")
})

router.get('/autocomplete/sections', async (ctx) => {
    ctx.body = await autocompleteField("section")
})

router.get('/autocomplete/organizations', async (ctx) => {
    ctx.body = await autocompleteField("organization")
})

router.get('/autocomplete/translationTypes', async (ctx) => {
    ctx.body = await autocompleteField("translation_type")
})

router.get('/autocomplete/sectionOptions', async (ctx) => {
ctx.body = [{
    label: 'COVID-19 Policy Watch',
    children: [
        {label: 'Physical distancing'},
        {label: 'Border measures'},
        {label: 'Business support'},
        {label: 'Wage and income support'},
        {label: 'Health services'},
        {label: 'Financial markets and monetary policy'},
        {label: 'Industry interventions'},
        {label: 'Testing and tracing'},
        {label: 'Emergency government'},
        {label: 'Medical products and medicines'},
        {label: 'Food and necessities'},
        {label: 'Public information'},
        {label: 'Citizens abroad'},
        {label: 'Public services'},
        {label: 'International cooperation'},
        {label: 'Education'},
        {label: 'Housing'},
        {label: 'Domestic travel'},
        {label: 'Policing and justice'},
        {label: 'Healthcare workers'},
        {label: 'Research'}]
}, {
    label: 'International Labour Organization',
    children: [
        {label: 'stimulateEmployment'},
        {label: 'protectWorkers'},
        {label: 'supportIncomes'},
        {label: 'employerActivities'},
        {label: 'iloActions'},
        {label: 'otherMeasures'},
        {label: 'workerActivities'},
        {label: 'socialDialogue'}]
}, {
    label: 'International Monetary Fund',
    children: [
        {label: 'Fiscal'},
        {label: 'Background'},
        {label: 'Exchange rate and balance of payments'},
        {label: 'Monetary and macro-financial'}
    ]
}]
})

router.get('/autocomplete/status', async (ctx) => {
  ctx.body = JSON.stringify([
      {name: 'subject_accepted', value: 'subject_accepted'},
      {name: 'subject_rejected', value: 'subject_rejected'}
  ])})

router.get('/documents/:id', async (ctx) => {
    console.log('/documents/:id', ctx.params.id)
    try {
        const query = await client.get({
            index: 'documents',
            id: ctx.params.id
        })

        const body = ctx.body = { id: query.body._id, ...query.body._source }

        if (body.keywords === '') { 
            body.keywords = []
        }
        ctx.status = 200
    } catch (e) {
        console.error('get id ', ctx.params.id, ' threw error: ', e);
        ctx.body = e.toString();
        ctx.status = 422;
    }
})

router.get('/documents/:id/pdf', async (ctx) => {
    try {
        const query = await client.get({
            index: 'documents',
            id: ctx.params.id
        })

        if (!query.body._source.pdf_path) {
            ctx.body = 'Document has no file!'
            ctx.status = 404
            return
        }

        const src = fs.createReadStream(query.body._source.pdf_path);
        ctx.response.set("content-type", "application/pdf");
        ctx.body = src;
    } catch (e) {
        console.error('get id ', ctx.params.id, ' threw error: ', e);
        ctx.body = e.toString();
        ctx.status = 422;
    }
})

router.get('/documents/:id/tsv', async (ctx) => {
    console.log('/documents/:id/tsv', ctx.params.id)
    try {
        const query = await client.get({
            index: 'documents',
            id: ctx.params.id
        })

        if (!query.body._source.annotation_path) {
            ctx.body = 'Document has no file!'
            ctx.status = 404
            return
        }

        var arr = query.body._source.annotation_path.split('/')

        const src = fs.createReadStream(query.body._source.annotation_path);
        ctx.response.set("content-type", "text/tab-separated-values");
        //ctx.response.set("content-disposition", `attachment; filename*=UTF-8''"${encodeURIComponent(query.body._source.title.substr(0, 40))}"`);

        ctx.response.set("content-disposition", `attachment; filename="${arr[arr.length-1]}"`);

        ctx.body = src;
    } catch (e) {
        console.error('get id ', ctx.params.id, ' threw error: ', e);
        ctx.body = e.toString();
        ctx.status = 422;
    }
})

router.get('/', (ctx) => {
  ctx.body = "Hello world!"
})

router.post('/delete', async (ctx) => {
    try {
        for (id of ctx.request.body.ids) {
            await client.delete({
                id: id,
                index: 'documents'
            })
        }
    } catch (e) {
        ctx.status = e.meta.statusCode
        ctx.body = e.toString()
        return
    }
    ctx.status = 200
    ctx.body = 'OK'
})

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
    let any_phrase = ""
    if (body.keywords != undefined) {
        any_phrase = body.keywords[0]
    }
    let params = constructParams(body, documentType, any_phrase)
    let request = await client.search(params);
    return request.body.hits.hits;
}

function constructParams(body, documentType, any_phrase){

    console.log('constructParams body', body)

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
                                "gte": body.infoDateFrom + " 00:00:01",
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
                        {match_phrase: {
                            original_text: {
                                query: any_phrase,
                                zero_terms_query: "all"
                                } 
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

    console.log('params', JSON.stringify(params))
    return params
}

router.post('/lad/search', async (ctx) => {
    await getDocuments(ctx, "legal_act");
});

router.post('/ssd/search', async (ctx) => {
    await getDocuments(ctx, "secondary_source");
});

router.post('/lad', async (ctx) => {
  await postDocument(ctx);
  ctx.status = 200
});

router.post('/lad/:id', upload.single('pdf'), async (ctx) => {
  await updateDocument(ctx);
  ctx.status = 200
});

router.post('/ssd/:id', upload.single('pdf'), async (ctx) => {
  await updateDocument(ctx);
  ctx.status = 200
});

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

router.post('/upload', upload.single('pdf'), (ctx) => {
    const pdf = ctx.req.file // originalname, encoding, mimetype, buffer, size
    if (!ctx.req.file) {
        ctx.body = "No file given!";
        ctx.status = 422;
        return
    }
    return new Promise((resolve, reject) => {
        const path = "/tmp/policydemic_" + pdf.originalname
        fs.writeFile(path, pdf.buffer, (err) => {
            if (err) {
                reject(err)
                return
            }
            const task = celery_client.createTask("nlpengine.tasks.process_pdf_path");
            const result = task.applyAsync([path]);

            ctx.body = "File sent for processing!"
            ctx.status = 200
            resolve(ctx)

            result.get().then(data => {
              console.log('celery task finished for pdf ', pdf.originalname, "\nresult:\n", data);
            });
        })
    })
});


router.post('/translate', (ctx) => {
    ctx.body = ctx.request.body
    document = ctx.body.document
    const task = celery_client.createTask("nlpengine.tasks.translate_and_update");
    const result = task.applyAsync([ctx.body.id, document]);
/*    result.get().then(data => {
      console.log('translated', data);
    })*/

    ctx.status = 200

});

router.post('/annotate/', (ctx) => {
    ctx.body = ctx.request.body
    document = ctx.body.document

    const task = celery_client.createTask("nlpengine.tasks.annotate_and_update");

    const result = task.applyAsync([ctx.body.id, document]);
    ctx.status = 200
});

router.get('/annotated', async (ctx) => {
    ctx.body = ctx.request.body
    let params = {
        index: 'documents',
        body: {
            query: {
                bool: {
                    must: [
                        {match: {
                            is_annotated: 'true'
                            }
                        }
                    ]
                }
            }
        }, 
        size: 1000
    }

    let request = await client.search(params);
    ctx.body =  request.body.hits.hits;

});

module.exports = constructParams;
app
  .use(cors())
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(8000);