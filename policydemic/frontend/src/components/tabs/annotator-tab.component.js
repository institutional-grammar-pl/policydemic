import React, { useState, useEffect } from 'react';
import { Container } from '@material-ui/core';
import { CircularProgress } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';

import AnnotationTableComponent from '../annotator/annotation-table.component.js';

import Api from '../../common/api.js';

export default function AnnotatorTabComponent() {
    const [documents, setDocuments] = useState();

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
            <Typography variant="body2" component="p" style={{"marginTop":'19px', 'marginLeft':'2em'}}>
                *Annotation files are in .tsv format and contain annotation of "IG Core Regulative" and "IG Core Constitutive" Layers.
            </Typography>
    </Container>);
}
