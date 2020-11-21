import React, { useEffect, useCallback } from 'react';
import 'date-fns';

import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';

import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import { useForm, Controller } from "react-hook-form";
import Api from "../../common/api";

import AsyncAutocomplete from "./async-autocomplete.component";
import UploadPdfComponent from './upload-pdf.component';

const selectDate = (v) => {
    try {
        const offset = v.getTimezoneOffset() * 60 * 1000
        return new Date(v - offset).toISOString().substr(0,10)
    } catch (e) {
        console.error(e)
        return v
    }
}
const selectDateTime = (v) => {
    try {
        const offset = v.getTimezoneOffset() * 60 * 1000
        return new Date(v - offset).toISOString().split(/[.T]/).splice(0, 2).join(' ')
    } catch (e) {
        console.error(e)
        return v
    }
}

export default function NewDocFormComponent({ document, type, onSuccessfulSend }) {
    const pdfUpload = type === "LAD";
    const [infoDate, setInfoDate] = React.useState(document ? document.info_date : undefined);
    const [scrapDate, setScrapDate] = React.useState(document ? document.scrap_date : undefined);

    const handleInfoDateChange = (date) => {
        date = selectDate(date);
        setInfoDate(date);
        setValue("infoDate", date);
    };

    const handleScrapDateChange = (date) => {
        date = selectDateTime(date);
        setScrapDate(date);
        setValue("scrapDate", date);
    };


    const { register, handleSubmit, setValue, getValues } = useForm({
        defaultValues: document ? {
            title: document.title,
            web_page: document.web_page,
            organization: document.organization,
            section: document.section,
            keywords: document.keywords || [],
            infoDate: document.info_date,
            scrapDate: document.scrap_date,
            country: document.country,
            language: document.language,
            translated_text: document.translated_text,
            original_text: document.original_text,
            annotation_text: document.annotation_text,

            status: document.status,
        } : undefined
    });
    useEffect(() => {
        if (pdfUpload) {
            register({ name: 'pdf' });
        }
        register({ name: "keywords"  });
        register({ name: "info_date" });
        register({ name: "scrap_date" });
        register({ name: "web_page" });
        register({ name: "country" });
        register({ name: "language" });
        register({ name: "status" });


    }, [register, pdfUpload])

    const onSubmit = data => {
     
        if (document) {
            Api.editDocument(type, document.id, data)
                .then(c => onSuccessfulSend());
        } else {
            Api.postDocument(type, data)
                .then(c => onSuccessfulSend());
        }
    };

    if (typeof document.keywords=== 'string') {
        document.keywords = document.keywords.split(',')
        document.keywords = document.keywords.filter(function (el) {
              return el != "";
        });
    }

    const onTranslateClicked = (event) => {
        Api.translateDocument(document.id, document);
        let i = 0;
        const load = () => {
            if (i++ > 10) return;
            Api.getDocumentById(document.id).then((d) => { 
                const doc = d.data;
                if (doc.translated_text) {
                    setValue('translated_text', doc.translated_text)
                } else {
                    setTimeout(load, 5000);
                }
            }).catch((e) => {
                console.error(e);
                setTimeout(load, 5000)
            });
        }
        setTimeout(load, 5000);
    };

    const onAnnotateClicked = (event) => {
        const document_values = getValues()
        Api.annotateDocument(document.id, document_values) 
    }

    return (
        <form id={document ? "edit-doc-form" : "new-doc-form"} onSubmit={handleSubmit(onSubmit)}>
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <Grid container spacing={5}>
                    <Grid container item xs={12} spacing={4} justify="center">
                        <Grid item md={8}>
                            <TextField
                                name="title"
                                inputRef={register}
                                label="Title"
                                margin="normal"
                                fullWidth
                            />
                        </Grid>
                    </Grid>

                    <Grid container item xs={12} spacing={8} justify="space-around">
                        <Grid item md={4}>
                            <TextField
                                name="web_page"
                                inputRef={register}
                                label="Web page"
                                margin="normal"
                                fullWidth
                            />
                        </Grid>
                        {(type === "LAD") && (<Grid item md={4}>
                             <AsyncAutocomplete
                                name="status"
                                collectionName="status"
                                style={{ width: 300 }}
                                openOnFocus
                                onChange={(_, opt) => setValue("status", opt.value)}
                                defaultValue={document ? {
                                    name: document.status,
                                    value: document.status,
                                } : undefined}
                                renderInput={(params) =>
                                    <TextField
                                        {...params}
                                        inputRef={register}
                                        label="Status" margin="normal" />}
                            />
                        </Grid>)}
                        {(type === "SSD") && (<Grid item md={4}>
                             <AsyncAutocomplete
                                name="organization"
                                collectionName="organizations"
                                style={{ width: 300 }}
                                openOnFocus
                                onChange={(_, opt) => setValue("organization", opt.value)}
                                defaultValue={document ? {
                                    name: document.organization,
                                    value: document.organization,
                                } : undefined}
                                renderInput={(params) =>
                                    <TextField
                                        {...params}
                                        inputRef={register}
                                        label="Organization" margin="normal" />}
                            />
                        </Grid>)}
                        {(type === "SSD") && (<Grid item md={4}>
                           <AsyncAutocomplete
                                name="section"
                                collectionName="sections"
                                style={{ width: 300 }}
                                openOnFocus
                                onChange={(_, opt) => setValue("section", opt.value)}
                                defaultValue={document ? {
                                    name: document.section,
                                    value: document.section,
                                } : undefined}
                                renderInput={(params) =>
                                    <TextField
                                        {...params}
                                        inputRef={register}
                                        label="Section" margin="normal" />}
                            />
                        </Grid>)}
                    </Grid>

                    <Grid container item xs={12} spacing={8} justify="space-around">
                        <Grid item md={4}>
                            <AsyncAutocomplete
                                name="keywords"
                                collectionName="keywords"
                                openOnFocus
                                fullWidth
                                multiple
                                defaultValue={
                                    document ? (document.keywords || []).map(k => ({
                                        name: k,
                                        value: k,
                                    })) : undefined
                                }
                                renderInput={(params) =>
                                    <TextField
                                        {...params}
                                        label="Keywords" margin="normal" />}

                                onChange={(_, opts) => setValue("keywords", opts.map(o => o.value))}
                            />
                        </Grid>
                        <Grid item md={4}>
                            <KeyboardDatePicker
                                disableToolbar
                                variant="inline"
                                format="yyyy-MM-dd"
                                margin="normal"
                                name="info_date"
                                label="Info date"
                                fullWidth
                                value={infoDate}
                                onChange={handleInfoDateChange}
                                KeyboardButtonProps={{
                                    'aria-label': 'change date',
                                }}
                            />
                        </Grid>
                        <Grid item md={4}>
                            <KeyboardDatePicker
                                disableToolbar
                                variant="inline"
                                format="yyyy-MM-dd"
                                margin="normal"
                                name="scrap_date"
                                label="Scrap date"
                                value={scrapDate}
                                onChange={handleScrapDateChange}
                                fullWidth
                                KeyboardButtonProps={{
                                    'aria-label': 'change date',
                                }}
                            />
                        </Grid>
                    </Grid>

                    <Grid container item xs={12} spacing={8} justify="space-around">
                        <Grid item md={4}>
                            <AsyncAutocomplete
                                name="country"
                                collectionName="countries"
                                style={{ width: 300 }}
                                openOnFocus
                                onChange={(_, opt) => setValue("country", opt.value)}
                                defaultValue={document ? {
                                    name: document.country,
                                    value: document.country,
                                } : undefined}
                                renderInput={(params) =>
                                    <TextField
                                        {...params}
                                        inputRef={register}
                                        label="Country" margin="normal" />}
                            />
                        </Grid>
                        <Grid item md={4}>
                            <AsyncAutocomplete
                                name="language"
                                collectionName="languages"
                                inputRef={register}
                                style={{ width: 300 }}
                                openOnFocus
                                onChange={(_, opt) => setValue("language", opt.value)}
                                defaultValue={document ? {
                                    name: document.language,
                                    value: document.language,
                                } : undefined}
                                renderInput={(params) =>
                                    <TextField
                                        {...params}
                                        inputRef={register}
                                        label="Language" margin="normal" />}
                            />
                        </Grid>
                    </Grid>

                    <Grid container item xs={12}>

                        <TextField
                            name="original_text"
                            inputRef={register}
                            label="original text"
                            InputLabelProps={{
                                shrink: true,
                            }}
                            multiline
                            rows={8}
                            fullWidth
                            variant="outlined"
                        />
                    </Grid>


                    {(type === "LAD") &&   (document.language !='English') &&
                    (<Button
                        variant="contained"
                        className="button-submit"
                        style={{ position: 'relative', left: 15, top: 5, margin: 5 }}
                        onClick={(event) => onTranslateClicked(event)}>
                        Translate
                    </Button>)}

               
                    {(type === "LAD") && (document.language !='English') && (<Grid container item xs={12}>
                        <TextField
                            name="translated_text"
                            inputRef={register}
                            label="Translation"
                            InputLabelProps={{
                                shrink: true,
                            }}
                            multiline
                            rows={8}
                            fullWidth
                            variant="outlined"
                        />
                    </Grid>)}

                    <Grid container item xs={12}>

                        <TextField
                            name="annotation_text"
                            inputRef={register}
                            label="Text to annotate"
                            InputLabelProps={{
                                shrink: true,
                            }}
                            multiline
                            rows={8}
                            fullWidth
                            variant="outlined"
                        />

                        <Button
                            variant="contained"
                            className="button-submit"
                            style={{ position: 'relative', left: 5, top: 5, margin: 5 }}
                            onClick={(event) => onAnnotateClicked(event)}>
                            Annotate
                        </Button>
                    </Grid>

                    {(document && (type === "LAD") && <Grid container item xs={12}>
                        <iframe style={{width: '100%', height: '30rem'}} src={`/documents/${document.id}/pdf`}/>
                    </Grid>)}
                </Grid>
            </MuiPickersUtilsProvider>
        </form >
    );
}
