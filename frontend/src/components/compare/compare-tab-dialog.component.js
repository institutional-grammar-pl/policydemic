
import React, { useEffect, useState } from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Api from '../../common/api';
import { CircularProgress } from '@material-ui/core';
import CompareFormComponent from './compare-tab.component.js'

export default function CompareTabDialogComponent({ type, onSuccess, documentIds, open, onClose, children }) {
    
    const [documents, setDocuments] = useState();    

    useEffect(() => {
        if (!documentIds) {
            return
        }
        const promiseList = documentIds.map((id) => Api.getDocumentById(id))
        Promise.all(promiseList)
            .then((docs) => docs.map((response) => response.data))
            .then((docs) => setDocuments(docs))
            .catch((e) => {
                console.error(e)
                alert("Error: " + e.toString())
            })
    }, [documentIds]);

    
    return (

        <Dialog variant="outlined" fullScreen open={open} onClose={onClose} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title" onClose={onClose}>
                Compare documents
            </DialogTitle>
            <DialogContent>
                {documents
                    ? <CompareFormComponent
                        documents={documents} />
                    : <CircularProgress />
                }
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    )
} 
