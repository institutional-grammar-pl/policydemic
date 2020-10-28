import React from 'react';
import Box from '@material-ui/core/Box';

import SearchTableComponent from './search-table.component.js';

export default class SearchResultsListComponent extends React.Component {

    render() {
        return (
            <Box
                textAlign="left"
            >                
                <SearchTableComponent 
                    tableTitle={this.props.headerCaption}
                    onAddNewItemClick={this.props.onAddNewItemClick}
                    onDelete={this.props.onDelete}
                    onEdit={this.props.onEdit}
                    rows={this.props.searchResultsList}
                />
            </Box>
        )
    }
}