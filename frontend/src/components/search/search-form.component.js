import React, { useEffect, useCallback } from 'react';
import 'date-fns';
import { useForm, Controller } from "react-hook-form";

import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import Box from '@material-ui/core/Box';

import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import AsyncAutocomplete from '../form/async-autocomplete.component';

export default function SearchFormComponent({ type, onSearch, onReset }) {

    const aWeekAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)
    const [formData, setFormData] = React.useState({});

    const setFDValue = (k, v, xx) => {
        setValue(k, v)
        if (v.constructor === Date) {
            const offset = v.getTimezoneOffset() * 60 * 1000
            v = new Date(v - offset).toISOString().substr(0,10)
            // formData[k] = v
            // return
        }
        // const newObj = { ...formData, [k]: v }
        // setFormData(newObj)
        formData[k] = v
        // setFormData(formData)
        // console.log(k,v,xx, formData)
    }

    const [selectedDateFrom, setSelectedDateFrom] = React.useState(aWeekAgo);
    const handleChangeDateFrom = (date) => {
        setSelectedDateFrom(date);
        setFDValue("infoDateFrom", date, 'idf');
    };

    const [selectedDateTo, setSelectedDateTo] = React.useState(new Date());
    const handleChangeDateTo = (date) => {
        setSelectedDateTo(date);
        setFDValue("infoDateTo", date, 'idt');
    };

    const onResetClicked = (event) => {
        console.log("reset!")
        setFormData({})
        setSelectedDateFrom(aWeekAgo);
        setSelectedDateTo(new Date());

        document.getElementById("search-form").reset();
        reset();

        onReset();
    };

    const onSubmit = (reactFormData) => {
        const data = {...formData, keywords: (formData.keywords || '').split(',')}
        if (data.keywords != undefined) {
        	data.keywords = data.keywords.split(',')
        }
        if (data.keywords == "") {
        	data.keywords = undefined
        }
        onSearch(data);
    }

    const { register, handleSubmit, errors, reset, setValue, control } = useForm();

    setFDValue('infoDateFrom', selectedDateFrom, 'initial');
    setFDValue('infoDateTo', selectedDateTo, 'initial');

    return (
        <form id="search-form" onSubmit={handleSubmit(onSubmit)}>
            <Box
                boxShadow={3}
                textAlign="left"
                m={3}
                p={2}
            >

                <Typography variant="h5" gutterBottom >
                    Search
                    </Typography>

                <MuiPickersUtilsProvider utils={DateFnsUtils}>
                    <Grid container justify="space-around">
                        {/*<Controller*/}
                        {/*    control={control}*/}
                        {/*    name="infoDateFrom"*/}
                        {/*    as={*/}
                        {/*        <KeyboardDatePicker*/}
                        {/*            disableToolbar*/}
                        {/*            variant="inline"*/}
                        {/*            format="yyyy-MM-dd"*/}
                        {/*            margin="normal"*/}
                        {/*            id="info-date-from"*/}
                        {/*            name="infoDateFrom"*/}
                        {/*            label="Info date from"*/}
                        {/*            onChange={() => {}}*/}
                        {/*            value={() => {}}*/}
                        {/*            KeyboardButtonProps={{*/}
                        {/*                'aria-label': 'change date',*/}
                        {/*            }}*/}
                        {/*        />*/}
                        {/*    }*/}
                        {/*/>*/}

                        <KeyboardDatePicker
                            disableToolbar
                            variant="inline"
                            format="yyyy-MM-dd"
                            margin="normal"
                            id="info-date-from"
                            name="infoDateFrom"
                            label="Info date from"
                            onChange={handleChangeDateFrom}
                            value={selectedDateFrom}
                            KeyboardButtonProps={{
                                'aria-label': 'change date',
                            }}
                        />

                        <KeyboardDatePicker
                            disableToolbar
                            variant="inline"
                            format="yyyy-MM-dd"
                            margin="normal"
                            id="info-date-to"
                            name="infoDateTo"
                            // ref={register({ name: 'infoDateTo' })}
                            label="Info date to"
                            onChange={handleChangeDateTo}
                            value={selectedDateTo}
                            KeyboardButtonProps={{
                                'aria-label': 'change date',
                            }}
                        />

                        {/* TODO: https://material-ui.com/components/autocomplete/#asynchronous-requests */}

                        <AsyncAutocomplete
                            name="web_page"
                            collectionName="webpages"
                            style={{ width: 300 }}
                            openOnFocus
                            fullWidth
                            multiple
                            renderInput={(params) =>
                                <TextField
                                    {...params}
                                    name="web_page"
                                    inputRef={register}
                                    label="Web page" margin="normal" />}
                            onChange={(_, opts) => setFDValue("web_page", opts.map(o => o.value))}
                        />

                        <AsyncAutocomplete
                            name="language"
                            collectionName="languages"
                            style={{ width: 300 }}
                            openOnFocus
                            fullWidth
                            multiple
                            renderInput={(params) =>
                                <TextField
                                    name="language"
                                    {...params}
                                    inputRef={register}
                                    label="Language" margin="normal" />}
                            onChange={(_, opts) => setFDValue("language", opts.map(o => o.value))}
                        />

                        <AsyncAutocomplete
                            name="country"
                            collectionName="countries"
                            style={{ width: 300 }}
                            openOnFocus
                            fullWidth
                            multiple
                            renderInput={(params) =>
                                <TextField
                                    {...params}
                                    name="country"
                                    inputRef={register}
                                    label="Country" margin="normal" />}
                            onChange={(e, opts) => setFDValue("country", opts.map(o => o.value), e)}
                        />

                        <TextField
                            name="keywords"
                            inputRef={register}
                            label="Any phrase"
                            margin="normal"
                            onChange={(event) => setFDValue("keywords", event.target.value)}
                            aria-invalid={errors['keywords'] ? "true" : "false"}
                        />
                    </Grid>
                </MuiPickersUtilsProvider>

                <Grid
                    container
                    style={{ display: 'flex', justifyContent: 'flex-end' }}
                    justify="space-around"
                >

                    <Button
                        variant="contained"
                        className="button-submit"
                        style={{ position: 'relative', right: 5, top: 5, margin: 5 }}
                        onClick={(event) => onResetClicked(event)}>
                        Reset
                    </Button>

                    <Button
                        variant="contained"
                        className="button-submit"
                        color="primary"
                        type="submit"
                        style={{ position: 'relative', right: 5, top: 5, margin: 5 }}
                        form="search-form"
                    >
                        Search
                    </Button>

                </Grid>
            </Box>
        </form>
    );
}
