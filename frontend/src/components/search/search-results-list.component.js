import React from 'react';
import Box from '@material-ui/core/Box';

import SearchTableComponent from './search-table.component.js';

export default class SearchResultsListComponent extends React.Component {

    /*createDataForRow(title, source, infoDate, language, keywords, country) {

        if (infoDate == "1900-01-01") {
            infoDate = ''
        }

        return {
            title: title,
            source: source,
            infoDate: infoDate,
            language: language,
            keywords: keywords,
            country: country
        };
      }*/

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