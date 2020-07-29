import axios from 'axios';

export default class Api {
    static baseUrl = ""

    static postDocument(type, data) {
        return this._postFormData(type.toLowerCase(), data);
    }

    static createDataForRow(id, source, infoDate, language, keywords, country) {
        return {
            id: id,
            source: source,
            infoDate: infoDate,
            language: language,
            keywords: keywords,
            country: country
        };
    }

    static getSearchResults(type, data) {

        /*var rows = [
            Api.createDataForRow(1, "International Labour Organization", new Date(1995, 4, 4), "english", "cinemas", "Canada"),
            Api.createDataForRow(2, "Coronavirus Government Response Tracker", new Date(1998, 0, 14), "french", "pubs", "Italy"),
            Api.createDataForRow(3, "Coronavirus Government Response Tracker", new Date(1990, 3, 24), "french", "pubs", "Italy")
        ];

        return new Promise((resolve, reject) => {
            setTimeout(resolve, 100, rows);
        });*/
        console.log('getSearchResults', type, data)
        return this._postJsonData(type.toLowerCase() + '/search', data).then((request) => request.data)
    }

    static editDocument(type, data) {
        return this._postFormData(type.toLowerCase(), data)
    }

    static saveCrawlerConfig(data) {
        return this._postJsonData("crawler/saveConfig", data);
    }

    static runCrawler(data) {
        return this._postJsonData("crawler/run", data);
    }

    static _postFormData(relativeUrl, data) {
        var formData = new FormData();
        Object.keys(data).forEach(key => formData.append(key, data[key]));

        return axios.post(`${this.baseUrl}/${relativeUrl}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    }

    static _postJsonData(relativeUrl, jsonData) {
        return axios.post(`${this.baseUrl}/${relativeUrl}`, jsonData, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    static getAutocompleteOptions(collectionName){
        // if (collectionName == 'webpages') {
        //     return Promise.resolve({data: [{"name":"google.com","value":"google.com"},{"name":"test","value":"test_webpage.com"},{"name":"bing.com","value":"bing.com"}]});
        // }

        return axios.get(`${this.baseUrl}/autocomplete/${collectionName}`);
    }

    static getDocumentById(documentId){
        return axios.get(`${this.baseUrl}/documents/${documentId}`);
    }
}
