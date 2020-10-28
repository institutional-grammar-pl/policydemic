import React, { useState, useEffect } from 'react';
import { Container } from '@material-ui/core';
import { useFormDialog } from '../../common/hooks/form-dialog-hook';
import AnnotationTableComponent from './annotation-table.component.js';
import { CircularProgress } from '@material-ui/core';

import Api from '../../common/api.js';

export default function AnnotatorTabComponent() {
    const [documents, setDocuments] = useState();
    const [openDialog, handleOpenDialog, handleCloseDialog] = useFormDialog();

    useEffect(() => {
        Api.getAnnotatedDocuments()
            .then(response => {
                setDocuments(response.data)
            });
    }, []);  


    return (<Container>
        { documents
            ? <AnnotationTableComponent
                headerCaption="Annotations"
                rows={documents.map((e)=> ({
                    title: e._source.title,
                    annotationDate: e._source.annotated_on, 
                    id: e._id
                }))}/>            
            : <CircularProgress />
        }
    </Container>);
}
