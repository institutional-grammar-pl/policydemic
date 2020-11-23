import React, { useCallback, useState } from 'react';
import Button from '@material-ui/core/Button';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Pagination from '@material-ui/lab/Pagination';
import Typography from '@material-ui/core/Typography';


import { Document, Page } from 'react-pdf';

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
    const [file, setFile] = useState();
    const [numPages, setNumPages] = useState();
    const [pageNo, setPageNo] = useState(1);

    const handleFileChange = useCallback((event) => {
        const newFile = event.target.files[0];
        if (newFile) {
            setFile(newFile);
            setValue(name, newFile);
        }
        document.getElementById('contained-button-file').value = ''
    }, [setFile, setValue]);

    const handleDocumentLoadSuccess = useCallback((obj) => {
        setNumPages(obj.numPages);
    }, [setNumPages]);

    const handlePageChange = useCallback((event, page) => {
        setPageNo(page);
    }, [setPageNo]);

    return (
        <Grid container spacing="5">
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