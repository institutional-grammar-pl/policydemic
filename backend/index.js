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


router.get('/', (ctx) => {
  ctx.body = "Hello world!"
})

router.get('/autocomplete/webpages', (ctx) => {
  ctx.body = JSON.stringify([
      {name: 'google.com', value: 'google.com'},
      {name: 'test', value: 'test_webpage.com'},
      {name: 'bing.com', value: 'bing.com'},
  ])
})

async function autocompleteField(field) {

    const results = await client.search({
        index: 'documents',
        body: {
             "size":"0",
             "aggs" : {
               "unique" : {
               "terms" : { "field" : field }
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

router.get('/documents/:id', async (ctx) => {
    console.log('get id', ctx.params.id)
    try {
        const query = await client.get({
            index: 'documents',
            id: ctx.params.id
        })

        const body = ctx.body = { id: query.body._id, ...query.body._source }
        const vars = { webPage: 'web_page', translationType: 'translation_type', infoDate: 'info_date', scrapDate: 'scrap_date',
            originalText: 'original_text' }

        for (k in vars) {
            body[k] = body[vars[k]]
            delete body[vars[k]] 
        }
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
    console.log('get pdf', ctx.params.id)
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


router.get('/', (ctx) => {
  ctx.body = "Hello world!"
})


router.post('/delete', async (ctx) => {
    console.log(ctx.request.body)
    try {
        for (id of ctx.request.body.ids) {
            console.log(id)
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

/*router.post('/crawler/saveConfig', upload.none(), (ctx) => {
  console.log(ctx.request)
  console.log(ctx.request.body)

  ctx.status = 200
});
*/
/*router.post('/crawler/run', upload.none(), (ctx) => {
  console.log(ctx.request)
  console.log(ctx.request.body)

  ctx.status = 200
});*/

/*router.get('/populate', (ctx) => {
    populate().then(r => console.log(r)).catch(console.log)
    ctx.status = 200
})
async function populate (){

    await client.index({
        index: 'documents',
        body:{
                web_page: 'test_webpage23.com',
                document_type: 'legalact',
                pdf_path: 'test_path',
                scrap_date: '2020-10-23 10:00:00',
                info_date: '2020-07-12',
                country: "Poland",
                language: "Polish",
                translation_type: "automatic",
                text_parsing_type: "ocr",
                keywords: ["test_kw"],
                original_text: "Oryginalny tekst dokumentu",
                translated_text: "Original text of the document",
                organization: "Test1",
                section: null
        }
    })
        .catch(e => {
            console.log(e)
        });

    await client.index({
        index: 'documents',
        body:{
            web_page: 'test_webpage.gov.pl',
            document_type: 'secondary',
            pdf_path: 'test_path',
            scrap_date: '2020-10-05 10:00:00',
            info_date: '2020-07-15',
            country: "Poland",
            language: "Polish",
            translation_type: "automatic",
            text_parsing_type: "ocr",
            keywords: ["si", "certo", "torro"],
            original_text: "Oryginalny tekst dokumentu",
            translated_text: "Original text of the document",
            organization: "Test2",
            section: null
        }
    })
        .catch(e => {
            console.log(e)
        });

    await client.index({
        index: 'documents',
        body:{
            web_page: 'test_webpageDE.com',
            document_type: 'legalact',
            pdf_path: 'test_path',
            scrap_date: '2020-11-23 10:00:00',
            info_date: '2020-07-12',
            country: "Germany",
            language: "German",
            translation_type: "manual",
            text_parsing_type: "parser",
            keywords: ["covid", "bulk"],
            original_text: "Oryginalny tekst dokumentu",
            organization: "Test3",
            translated_text: "Original text of the document",
            section: null
        }
    })
        .catch(e => {
            console.log(e)
        });

    await client.index({
        index: 'documents',
        body:{
            web_page: 'italian.gov.com',
            document_type: 'secondary',
            pdf_path: 'test_path',
            scrap_date: '2020-01-23 10:00:00',
            info_date: '2020-07-12',
            country: "Italy",
            language: "Italian",
            translation_type: "automatic",
            text_parsing_type: "ocr",
            keywords: ["testIT", "pizza", "espresso"],
            original_text: "Oryginalny tekst dokumentu",
            organization: "Test1",
            translated_text: "Original text of the document",
            section: null
        }
    })
        .catch(e => {
            console.log(e)
        });

    await client.index({
        index: 'documents',
        body:{
            web_page: 'test_webpage23.com',
            document_type: 'secondary',
            pdf_path: 'test_path',
            scrap_date: '2020-10-23 10:00:00',
            info_date: '2020-07-12',
            country: "Poland",
            language: "Polish",
            translation_type: "automatic",
            text_parsing_type: "ocr",
            keywords: "test_kw",
            original_text: "Oryginalny tekst dokumentu",
            organization: "Test2",
            translated_text: "Original text of the document",
            section: null
        }
    })
        .catch(e => {
            console.log(e)
        });



    await client.indices.refresh({
        index: 'documents'
    })
}*/

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
            id: element._id,
            source: element._source.source,
            /*source: element._source.web_page,*/
            infoDate: element._source.info_date,
            language: element._source.language,
            keywords: k === '' ? [] : k,
            country: element._source.country,
        })
    });
    return parsedData;
}

async function fetchDocumentsFromElastic(body, documentType){
    console.log('body', body)
    let any_phrase = body.keywords[0]
    let params = constructParams(body, documentType, any_phrase)
    let request = await client.search(params);
    return request.body.hits.hits;
}

function constructParams(body, documentType, any_phrase){
    
    let params = {
        index: 'documents',
        body: {
            query:{
                bool: {
                    must: [
                        { match: { document_type: documentType}}
                       ],
                }
            }
        }, 
        size: 100
    }

    /*let params = {
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
                                zero_terms_query: all
                                } 
                            }
                        }
                    ] 
                }
            }
        }, 
        size: 100
    }*/

    if(body.infoDateTo && body.infoDateFrom && body.infoDateTo.length > 0 && body.infoDateFrom.length > 0){
        params.body.query.bool.must.push({ range: { info_date: { gte: body.infoDateFrom, lte: body.infoDateTo }}},)
    }

    let fields = ["title", "source", "country", "language", "keywords" ];

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

    console.log(JSON.stringify(params))
    return params
}

router.post('/lad/search', async (ctx) => {
    console.log('ctx.request', ctx.request)
    await getDocuments(ctx, "legal_act");
});

router.post('/ssd/search', async (ctx) => {
    console.log('ctx.request', ctx.request)
    await getDocuments(ctx, "secondary_source");
});

router.post('/lad', async (ctx) => {
  console.log('post /lad');
  await postDocument(ctx);
  ctx.status = 200
});


router.post('/lad/:id', upload.single('pdf'), async (ctx) => {
  console.log('post /lad/', ctx.params.id);
  await updateDocument(ctx);
  ctx.status = 200
});

router.post('/ssd/:id', upload.single('pdf'), async (ctx) => {
  console.log('post /ssd/', ctx.params.id);
  await updateDocument(ctx);
  ctx.status = 200
});

async function postDocument(ctx){
    const body = { ...ctx.request.body }
    console.log(body)
    const vars = { webPage: 'web_page', translationType: 'translation_type', infoDate: 'info_date', scrapDate: 'scrap_date',
        originalText: 'original_text' }

    for (k in vars) {
        body[vars[k]] = body[k]
        delete body[k] 
    }

    console.log('post new document ', body)

    await client.index({
        index: 'documents',
        body: {
            doc: body
        }
    })    
}

async function updateDocument(ctx){
    
    const body = { ...ctx.request.body }
    const vars = { webPage: 'web_page', translationType: 'translation_type', infoDate: 'info_date', scrapDate: 'scrap_date',
        originalText: 'original_text' }

    for (k in vars) {
        body[vars[k]] = body[k]
        delete body[k] 
    }

    console.log('update document ', ctx.params.id, body)

    await client.update({
        index: 'documents',
        id: ctx.params.id,
        body: {
            doc: body
        }
    })
}

module.exports = constructParams;
app
  .use(cors())
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(8000);
