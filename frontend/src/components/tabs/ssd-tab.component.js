import React, { useState } from 'react';
import SearchFormComponent from '../search/search-form.component.js';
import SearchResultsListComponent from '../search/search-results-list.component'
import { Container } from '@material-ui/core';
import EditDocDialogComponent from '../form/edit-doc-dialog.component.js';
import NewDocFormComponent from '../form/new-doc-form.component.js';
import { useFormDialog } from '../../common/hooks/form-dialog-hook';

import Api from '../../common/api.js';

export default function SsdTabComponent() {

    const [openDialog, handleOpenDialog, handleCloseDialog] = useFormDialog();
    const [editedDocumentId, setEditedDocumentId] = useState();

    const [searchResults, setSearchResults] = React.useState([]);

    const handleSearch = (formData) => {

        Api.getSearchResults("SSD", formData).then((resp) => 
        {
            setSearchResults(resp);
        });
    }

    const handleReset = () => {
        setSearchResults([]);
    }

    const handleOnDelete = (selected) => {
        Api.deleteDocuments(selected).catch(()=>{}).then(()=>{
            const newSearchResults = searchResults.filter(row=>!selected.includes(row.id))
            setSearchResults(newSearchResults)
        })
    }

    return (

        <Container>

            <SearchFormComponent type="SSD" onSearch={handleSearch} onReset={handleReset}/>
            
            {editedDocumentId && (
                <EditDocDialogComponent
                    open={true}
                    onClose={() => setEditedDocumentId(undefined)}
                    type="SSD"
                    onSuccess={() => setEditedDocumentId(undefined)}
                    documentId = {editedDocumentId}
                />
            )}

            <SearchResultsListComponent
                headerCaption="SSD"
                onAddNewItemClick={handleOpenDialog}
                onEdit={documentId => setEditedDocumentId(documentId)}
                onDelete={handleOnDelete}
                searchResultsList={searchResults}
            />

        </Container>);
}
