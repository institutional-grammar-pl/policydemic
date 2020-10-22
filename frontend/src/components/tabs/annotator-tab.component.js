import React, { useState } from 'react';
import { Container } from '@material-ui/core';
import { useFormDialog } from '../../common/hooks/form-dialog-hook';
import AnnotationTableComponent from './annotation-table.component.js';


import Api from '../../common/api.js';

export default function AnnotatorTabComponent() {

    const [openDialog, handleOpenDialog, handleCloseDialog] = useFormDialog();

    return (<Container>
        <AnnotationTableComponent
            headerCaption="Annotations"
            rows={[{
            title: 'a',
            annotationDate: 'b',
        }]}
        />
    </Container>);
}
