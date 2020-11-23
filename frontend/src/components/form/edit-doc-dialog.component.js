import React, { useEffect, useState } from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Api from '../../common/api';
import EditDocFormComponent from "./edit-doc-form.component";
import { CircularProgress } from '@material-ui/core';

export default function EditDocDialogComponent({ type, onSuccess, documentId, open, onClose, children }) {
    const [document, setDocument] = useState();    

    useEffect(() => {
        Api.getDocumentById(documentId)
            .then(response => setDocument(response.data));
    }, [documentId]);  

    return (
        <Dialog variant="outlined" fullScreen open={open} onClose={onClose} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title" onClose={onClose}>
                Edit document
            </DialogTitle>
            <DialogContent>
                {document
                    ? <EditDocFormComponent
                        type={type}
                        onSuccessfulSend={onSuccess}
                        document={document} />
                    : <CircularProgress />
                }
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Cancel
                </Button>
                <Button form="edit-doc-form" type="submit" color="primary">
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    )
} 
