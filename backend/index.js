const Koa = require('koa');
const KoaRouter = require('koa-router');
const bodyParser = require('koa-bodyparser');
const multer = require('koa-multer');
const cors = require('@koa/cors');
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

router.get('/autocomplete/countries', (ctx) => {
  ctx.body = JSON.stringify([
    {name: "Poland", value: "Poland"},
    {name: "USA", value: "USA"},
    {name: "China", value: "China"},
    {name: "Italy", value: "Italy"},
  ])
})

router.get('/autocomplete/languages', (ctx) => {
  ctx.body = JSON.stringify([
    {name: "Polish", value: "Polish"},
    {name: "English", value: "English"},
    {name: "Chinese", value: "Chinese"},
    {name: "Italian", value: "Italian"},
  ])
})

router.get('/autocomplete/keywords', (ctx) => {
  ctx.body = JSON.stringify([
    {name: "School Closing", value: "School Closing"},
    {name: "Shopping restrictions", value: "Shopping restrictions"},
  ])
})

router.get('/autocomplete/translationTypes', (ctx) => {
  ctx.body = JSON.stringify([
    {name: "none", value: "none"},
    {name: "Google Translate", value: "Google Translate"},
    {name: "DeepL", value: "DeepL"},
  ])
})

router.get('/documents/:id', async (ctx) => {
    console.log('id', ctx.params.id)
    try {
        let zmienna = await client.get({
            index: 'documents',
            id: ctx.params.id
        })
        nazwy = {webPage: 'web_page', translationType: 'translation_type', infoDate: 'info_date', scrapDate: 'scrap_date',
        originalText: 'original_text'}
        for (k in nazwy) {
            zmienna.body._source[k] = zmienna.body._source[nazwy[k]]
            delete zmienna.body._source[nazwy[k]] 
        }
        ctx.body = zmienna.body._source;
        ctx.body.id = zmienna.body._id
        console.log('ctx.body', ctx.body)
    } catch (e) {
        console.error('tutaj blad!:', e);
        ctx.body = e.toString();
        ctx.status = 422;
    }
})


router.get('/', (ctx) => {
  ctx.body = "Hello world!"
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
        parsedData.push({
            id: element._id,
            /* source: element._source.organization,*/
            source: element._source.web_page,
            infoDate: element._source.info_date,
            language: element._source.language,
            keywords: element._source.keywords,
            country: element._source.country
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
    let params = {
        index: 'documents',
        body: {
            query:{
                bool: {
                    must: [
                        { match: { document_type: documentType}}],
                }
            }
        }
    }

    if(body.infoDateTo && body.infoDateFrom && body.infoDateTo.length > 0 && body.infoDateFrom.length > 0){
        params.body.query.bool.must.push({ range: { info_date: { gte: body.infoDateFrom, lte: body.infoDateTo }}},)
    }

    let fields = ["web_page", "country", "language", "keywords" ];

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
    console.log(ctx.request)
    await getDocuments(ctx, "legalact");
});

router.post('/ssd/search', upload.none(), async (ctx) => {
    console.log(ctx.request.body)
    await getDocuments(ctx, "secondary");
});

router.post('/lad/:id', upload.single('pdf'), async (ctx) => {
  console.log('ctx', ctx)
  console.log('id', ctx.params.id)
  console.log(ctx.request)
  console.log(ctx.request.body)
  await updateDocument(ctx);
  ctx.status = 200
});

router.post('/ssd/:id', upload.single('pdf'), async (ctx) => {
  console.log('ctx', ctx)
  console.log('id', ctx.params.id)
  console.log(ctx.request)
  console.log(ctx.request.body)
  await updateDocument(ctx);
  ctx.status = 200
});

async function updateDocument(ctx){
    await client.update({
        index: 'documents',
        id: ctx.params.id,
        body: {
            doc: ctx.request.body
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