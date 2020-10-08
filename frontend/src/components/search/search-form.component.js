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

import DropdownTreeSelect from 'react-dropdown-tree-select'
import './dropdown_styles.css'

import Api from '../../common/api';

const selectDate = (v) => {
    try {
        const offset = v.getTimezoneOffset() * 60 * 1000
        return new Date(v - offset).toISOString().substr(0,10)
    } catch (e) {
        console.error(e)
        return v
    }
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
        register({ name: "section" });
        register({ name: "organization" });
        register({ name: "country" });
        register({ name: "keywords" });
        register({ name: "status" });


    }, [register])

    setValue('infoDateFrom', selectedDateFrom);
    setValue('infoDateTo', selectedDateTo);

    const [sectionOptions, setSectionOptions] = React.useState(null);
    if (type === "SSD" && sectionOptions === null) {
        setSectionOptions([])
        Api.getAutocompleteOptions('sectionOptions')
            .then((response) => response.data)
            .then((opts) => {
                setSectionOptions(opts)
            })
    }

    const updateSectionNode = node => {
        const data = sectionOptions
        const loc = node._id.split('-')
        let v = data[loc[1]]
        if (loc[2]) {
            v = v.children[loc[2]]
        }
        v.expanded = node.expanded
        v.checked = node.checked
    }

    const onSectionChanged = (node, all) => {
        updateSectionNode(node)
        const data = sectionOptions
        const result = []

        all.forEach((val) => {
            const loc = val._id.split('-')
            const v = data[loc[1]]
            if (loc[2]) {
                result.push(v.children[loc[2]])
            } else {
                result.push(...v.children)
            }
        })
        const sections = result.map((e) => e.value || e.label)
        setValue('section', sections)
    }


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

                    <Grid container item xs={12} spacing={1} justify="space-around"> 
                        <Grid item xs={4}>
                            <TextField
                                name="keywords"
                                inputRef={register}
                                label="Any phrase"
                                margin="normal"
                                onChange={(event) => setValue("keywords", event.target.value)}
                                aria-invalid={errors['keywords'] ? "true" : "false"}
                            />
                        </Grid>

                        <Grid item xs={4}>
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
                        </Grid>

                        <Grid item xs={4}>
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
                        </Grid>

                    </Grid>
                    <Grid container item xs={12} spacing={1} justify="space-around">

                        <Grid item xs={4}>
                            <AsyncAutocomplete
                                name="country"
                                collectionName="countries"
                                // style={{ width: 250 }}
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
                        </Grid>

                        {(type === "SSD") && /*
                        <Grid item xs={4}>
                            <AsyncAutocomplete
                                name="organization"
                                collectionName="organizations"
                                style={{ width: 250 }}
                                openOnFocus
                                fullWidth
                                multiple
                                renderInput={(params) =>
                                    <TextField
                                        {...params}
                                        name="organization"
                                        inputRef={register}
                                        label="Organization" margin="normal" />}
                                onChange={(e, opts) => setValue("organization", opts.map(o => o.value), e)}
                            />
                        </Grid>,

                        <Grid item xs={4}>
                            <AsyncAutocomplete
                                name="section"
                                collectionName="sections"
                                style={{ width: 250 }}
                                openOnFocus
                                fullWidth
                                multiple
                                renderInput={(params) =>
                                    <TextField
                                        {...params}
                                        name="section"
                                        inputRef={register}
                                        label="Section" margin="normal" />}
                                onChange={(e, opts) => setValue("section", opts.map(o => o.value), e)}
                            />
                        </Grid>*/

                        (<Grid item xs={5}>
                            <DropdownTreeSelect data={sectionOptions} onChange={onSectionChanged} onNodeToggle={updateSectionNode} texts={{placeholder:"Section"}}/>
                        </Grid>)}

                        {(type === "LAD") && (<Grid item xs={4}>
                            <AsyncAutocomplete
                                name="status"
                                collectionName="status"
                                openOnFocus
                                fullWidth
                                multiple
                                renderInput={(params) =>
                                    <TextField
                                        {...params}
                                        name="status"
                                        inputRef={register}
                                        label="Status" margin="normal" />}
                                onChange={(e, opts) => setValue("status", opts.map(o => o.value), e)}
                            />
                        </Grid>)}
                        

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
