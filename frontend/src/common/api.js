import axios from 'axios';

export default class Api {
    static baseUrl = ""

    static postDocument(type, data) {
        console.log('postDocument')
        console.log('type', type)
        console.log('data', data)
        return this._postJsonData(type.toLowerCase(), data);
    }

    static createDataForRow(title, id, source, infoDate, language, keywords, country) {
        return {
            title: title, 
            id: id,
            source: source,
            infoDate: infoDate,
            language: language,
            keywords: keywords,
            country: country
        };
    }

    static getSearchResults(type, data) {
        console.log('getSearchResults', type, data)
        data['status'] = 'subject_accepted'
        console.log('data2', data)
        return this._postJsonData(type.toLowerCase() + '/search', data).then((request) => request.data)
    }

    static editDocument(type, id, data) {
        console.log('editDocument')
        console.log('type', type)
        console.log('id', id)
        console.log('data', data)
        return this._postJsonData(`${type.toLowerCase()}/${id}`, data)
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
        console.log('_postJsonData', relativeUrl, jsonData)
        return axios.post(`${this.baseUrl}/${relativeUrl}`, jsonData, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    static getAutocompleteOptions(collectionName){
        return axios.get(`${this.baseUrl}/autocomplete/${collectionName}`);
    }

    static getDocumentById(documentId){
        return axios.get(`${this.baseUrl}/documents/${documentId}`);
    }

    static deleteDocuments(documentIds){
        return this._postJsonData('delete', {ids:documentIds})
    }
}
