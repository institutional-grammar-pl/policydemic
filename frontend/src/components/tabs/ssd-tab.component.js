import React, { useState } from 'react';
import SearchFormComponent from '../search/search-form.component.js';
import SearchResultsListComponent from '../search/search-results-list.component'
import { Container } from '@material-ui/core';
import NewDocDialogComponent from '../form/new-doc-dialog.component.js';
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
        alert(selected.join(','));
    }

    return (<Container>
        <SearchFormComponent onSearch={handleSearch} onReset={handleReset}/>
        <NewDocDialogComponent open={openDialog} onClose={handleCloseDialog}>
            <NewDocFormComponent type="SSD" onSuccessfulSend={handleCloseDialog}/>
        </NewDocDialogComponent>
        {
            editedDocumentId && (
                <EditDocDialogComponent
                    open={true}
                    onClose={() => setEditedDocumentId(undefined)}
                    type="SSD"
                    onSuccess={() => setEditedDocumentId(undefined)}
                    documentId = {editedDocumentId}
                />
            )
        }
        <SearchResultsListComponent
            headerCaption="SSD"
            onAddNewItemClick={handleOpenDialog}
            onEdit={documentId => setEditedDocumentId(documentId)}
            onDelete={handleOnDelete}
            searchResultsList={searchResults}
        />
    </Container>);
}
