import React, { useEffect, useCallback } from 'react';
import 'date-fns';
import { useForm } from "react-hook-form";

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
    const formData = {infoDateFrom: aWeekAgo, infoDateTo: new Date()}

    const setValue = (k, v) => {
        formData[k] = v
        console.log(k,v,formData)
    }

    const [selectedDateFrom, setSelectedDateFrom] = React.useState(aWeekAgo);
    const handleChangeDateFrom = (date) => {
        console.log(date)
        setSelectedDateFrom(date);
        setValue("infoDateFrom", date.toISOString());
    };


    const [selectedDateTo, setSelectedDateTo] = React.useState(new Date());
    const handleChangeDateTo = (date) => {
        setSelectedDateTo(date);
        setValue("infoDateTo", date.toISOString());
    };

    const onResetClicked = (event) => {
        console.log("reset!")
        formData = {}
        setSelectedDateFrom(aWeekAgo);
        setSelectedDateTo(new Date());
        
        // setValue("web_page", []);
        // setValue("language", []);
        // setValue("country", []);
        // setValue("keywords", "");

        document.getElementById("search-form").reset();
        reset();

        onReset();
    };

    const onSubmit = () => {
        const data = {...formData}
        onSearch(data);
    }

    const { register, handleSubmit, errors, reset } = useForm();

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
                        <KeyboardDatePicker
                            disableToolbar
                            variant="inline"
                            format="yyyy-MM-dd"
                            margin="normal"
                            id="info-date-from"
                            name="infoDateFrom"
                            ref={register({ name: 'infoDateFrom' })}
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
                            ref={register({ name: 'infoDateTo' })}
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
                            ref={register({ name: 'web_page' })}
                            collectionName="webpages"
                            style={{ width: 300 }}
                            openOnFocus
                            fullWidth
                            multiple
                            renderInput={(params) =>
                                <TextField
                                    {...params}
                                    label="Web page" margin="normal" />}
                            onChange={(_, opts) => setValue("web_page", opts.map(o => o.value).join(','))}
                        />

                        <AsyncAutocomplete
                            name="language"
                            ref={register({ name: 'language' })}
                            collectionName="languages"
                            style={{ width: 300 }}
                            openOnFocus
                            fullWidth
                            multiple
                            renderInput={(params) =>
                                <TextField
                                    {...params}
                                    label="Language" margin="normal" />}
                            onChange={(_, opts) => setValue("language", opts.map(o => o.value).join(','))}
                        />

                        <AsyncAutocomplete
                            name="country"
                            ref={register({ name: 'country' })}
                            collectionName="countries"
                            style={{ width: 300 }}
                            openOnFocus
                            fullWidth
                            multiple
                            renderInput={(params) =>
                                <TextField
                                    {...params}
                                    label="Country" margin="normal" />}
                            onChange={(_, opts) => setValue("country", opts.map(o => o.value).join(','))}
                        />

                        <TextField
                            name="keywords"
                            ref={register({ required: true })}
                            label="Any phrase"
                            margin="normal"
                            onChange={(event) => setValue("keywords", event.target.value)}
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
