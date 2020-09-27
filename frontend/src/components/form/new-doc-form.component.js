import React, { useEffect, useCallback } from 'react';
import 'date-fns';

import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';

import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import { useForm, Controller } from "react-hook-form";
import Api from "../../common/api";

import AsyncAutocomplete from "./async-autocomplete.component";
import UploadPdfComponent from './upload-pdf.component';

const selectDate = (v) => {
    const offset = v.getTimezoneOffset() * 60 * 1000
    return new Date(v - offset).toISOString().substr(0,10)
}
const selectDateTime = (v) => {
    const offset = v.getTimezoneOffset() * 60 * 1000
    return new Date(v - offset).toISOString().split(/[.T]/).splice(0, 2).join(' ')
}

export default function NewDocFormComponent({ document, type, onSuccessfulSend }) {
    const pdfUpload = type === "LAD";
    const [infoDate, setInfoDate] = React.useState(document ? document.infoDate : undefined);
    const [scrapDate, setScrapDate] = React.useState(document ? document.scrapDate : undefined);

    const handleInfoDateChange = (date) => {
        date = selectDate(date);
        setInfoDate(date);
        console.log('infoDate', date)
        setValue("infoDate", date);
    };

    const handleScrapDateChange = (date) => {
        date = selectDateTime(date);
        setScrapDate(date);
        console.log('scrapDate', date)
        setValue("scrapDate", date);
    };


    const { register, handleSubmit, setValue } = useForm({
        defaultValues: document ? {
            title: document.title,
            webPage: document.webPage,
            organization: document.organization,
            section: document.section,
            keywords: document.keywords || [],
            infoDate: document.infoDate,
            scrapDate: document.scrapDate,
            country: document.country,
            language: document.language,
            translationType: document.translationType,
            translated_text: document.translated_text,
            original_text: document.originalText,
        } : undefined
    });
    useEffect(() => {
        if (pdfUpload) {
            register({ name: 'pdf' });
        }
        register({ name: "title"  });
        register({ name: "keywords"  });
        register({ name: "infoDate" });
        register({ name: "scrapDate" });

        register({ name: "country" });
        register({ name: "language" });
        register({ name: "translationType" });

    }, [register, pdfUpload])

    const onSubmit = data => {
        console.log('onSubmit document',document)
        console.log('onSubmit data', data)
        // if (data.keywords == undefined) {
        //     data.keywords = []
        // }
        console.log('kw:', data.keywords)
        if (document) {
            console.log('editDocument in onSubmit')
            Api.editDocument(type, document.id, data)
                .then(c => onSuccessfulSend());
        } else {
            Api.postDocument(type, data)
                .then(c => onSuccessfulSend());
        }
    };

    return (
        <form id={document ? "edit-doc-form" : "new-doc-form"} onSubmit={handleSubmit(onSubmit)}>
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <Grid container spacing={5}>
                    <Grid container item xs={12} spacing={8} justify="space-around">
                        <Grid item md={4}>
                            <TextField
                                name="webPage"
                                inputRef={register}
                                label="Web page"
                                margin="normal"
                                fullWidth
                            />
                        </Grid>
                        <Grid item md={4}>
                            <TextField
                                name="organization"
                                inputRef={register}
                                label="Organization"
                                margin="normal"
                                fullWidth
                            />
                        </Grid>
                        <Grid item md={4}>
                            <TextField
                                name="section"
                                inputRef={register}
                                label="Section"
                                margin="normal"
                                fullWidth
                            />
                        </Grid>
                    </Grid>

                    <Grid container item xs={12} spacing={8} justify="space-around">
                        <Grid item md={4}>
                            <AsyncAutocomplete
                                name="keywords"
                                collectionName="keywords"
                                style={{ width: 300 }}
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
                                name="infoDate"
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
                                name="scrapDate"
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
                        {(type === "LAD") && (<Grid item md={4}>
                            <AsyncAutocomplete
                                name="translationType"
                                collectionName="translationTypes"
                                inputRef={register}
                                style={{ width: 300 }}
                                openOnFocus
                                onChange={(_, opt) => setValue("translationType", opt.value)}
                                defaultValue={document ? {
                                    name: document.translationType,
                                    value: document.translationType,
                                } : undefined}
                                renderInput={(params) =>
                                    <TextField
                                        {...params}
                                        inputRef={register}
                                        label="Translation type" margin="normal" />}
                            />
                        </Grid>)}
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

                    {(type === "LAD") && (<Grid container item xs={12}>
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

                    {(document && <Grid container item xs={12}>
                        <iframe style="width: 100%; height: 30rem" src={`/documents/${document.id}/pdf`}/>
                    </Grid>)}
                </Grid>
            </MuiPickersUtilsProvider>
        </form >
    );
}
