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

const selectDate = (v) => {
    const offset = v.getTimezoneOffset() * 60 * 1000
    return new Date(v - offset).toISOString().substr(0,10)
}

export default function SearchFormComponent({ type, onSearch, onReset }) {
    const aWeekAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
    const { register, handleSubmit, errors, reset, setValue, control } = useForm();

    const [selectedDateFrom, setSelectedDateFrom] = React.useState(selectDate(aWeekAgo));
    const handleChangeDateFrom = (date) => {
        date = selectDate(date);
        setSelectedDateFrom(date);
        setValue("infoDateFrom", date);
    };

    const [selectedDateTo, setSelectedDateTo] = React.useState(selectDate(new Date()));
    const handleChangeDateTo = (date) => {
        date = selectDate(date);
        setSelectedDateTo(date);
        setValue("infoDateTo", date);
    };

    const onResetClicked = (event) => {
        document.getElementById("search-form").reset();

        const buttons = document.querySelectorAll('#search-form .MuiAutocomplete-root .MuiAutocomplete-clearIndicatorDirty')
        buttons.forEach((button) => button.click());

        reset();
        
        handleChangeDateFrom(aWeekAgo);
        handleChangeDateTo(new Date());

        onReset();
    };

    const onSubmit = (data) => {
        if (data.keywords == "") {
            data.keywords = undefined
        }
        if (data.keywords != undefined) {
            data.keywords = data.keywords.split(',')
        }
        onSearch(data);
    }

    useEffect(() => {
        register({ name: "infoDateFrom"  });
        register({ name: "infoDateTo" });
        register({ name: "web_page" });

        register({ name: "language" });
        register({ name: "country" });
        register({ name: "keywords" });

    }, [register])

    setValue('infoDateFrom', selectedDateFrom);
    setValue('infoDateTo', selectedDateTo);

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
                            name="infoDateFrom"
                            label="Info date from"
                            value={selectedDateFrom}
                            onChange={handleChangeDateFrom}
                            KeyboardButtonProps={{
                                'aria-label': 'change date',
                            }}
                        />

                        <KeyboardDatePicker
                            disableToolbar
                            variant="inline"
                            format="yyyy-MM-dd"
                            margin="normal"
                            name="infoDateTo"
                            label="Info date to"
                            value={selectedDateTo}
                            onChange={handleChangeDateTo}
                            KeyboardButtonProps={{
                                'aria-label': 'change date',
                            }}
                        />

                        {/* TODO: https://material-ui.com/components/autocomplete/#asynchronous-requests */}

                        <AsyncAutocomplete
                            name="web_page"
                            collectionName="webpages"
                            inputRef={register}
                            style={{ width: 300 }}
                            openOnFocus
                            fullWidth
                            multiple
                            onChange={(_, opts) => setValue("web_page", opts.map(o => o.value))}
                            renderInput={(params) =>
                                <TextField
                                    {...params}
                                    inputRef={register}
                                    label="Web page" margin="normal" />}
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
                                    {...params}
                                    inputRef={register}
                                    label="Language" margin="normal" />}
                            onChange={(_, opts) => setValue("language", opts.map(o => o.value))}
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
                            onChange={(e, opts) => setValue("country", opts.map(o => o.value), e)}
                        />

                        <TextField
                            name="keywords"
                            inputRef={register}
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
