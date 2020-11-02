import axios from 'axios';

export default class Api {
    static baseUrl = ""

    static postDocument(type, data) {
        return this._postJsonData(type.toLowerCase(), data);
    }

    static getSearchResults(type, data) {
        return this._postJsonData(type.toLowerCase() + '/search', data).then((request) => request.data)
    }

    static editDocument(type, id, data) {
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

    static uploadPDF(pdfFile) {
        return this._postFormData('upload', {pdf: pdfFile})
    }

    static translateDocument(documentID, document){
        return this._postJsonData('translate', {id: documentID, document: document})
    }

    static annotateDocument(documentID, document){
        return this._postJsonData('annotate', {id: documentID, document: document})
    }

    static getAnnotatedDocuments() {
        return axios.get(`${this.baseUrl}/annotated`);
    }
}
