import React, { useCallback } from 'react';
import Button from '@material-ui/core/Button';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';

const useStyles = makeStyles((theme) => ({
    root: {
        '& > *': {
            margin: theme.spacing(1),
        },
    },
    input: {
        display: 'none',
    },
}));


export default function UploadComponent({ name, setValue }) {
    const classes = useStyles();

    const handleFileChange = useCallback((event) => {
        const newFile = event.target.files[0];
        if (newFile) {
            setValue(name, newFile);
        }
        document.getElementById('contained-button-file').value = ''
    }, [setValue]);

    return (
        <Grid container spacing={5}>
            <Grid item xs={5}>
                <div className={classes.root}>
                    <input
                        accept=".pdf,.txt"
                        className={classes.input}
                        name={name}
                        id="contained-button-file"
                        type="file"
                        onChange={handleFileChange}
                    />
                    <label htmlFor="contained-button-file">
                        <Button
                            variant="contained"
                            color="default"
                            endIcon={<CloudUploadIcon />}
                            component="span"
                        >
                            Upload Document
                        </Button>
                     </label>
                </div>
            </Grid>
        </Grid>

    )
}