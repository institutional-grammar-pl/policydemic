import React, { useEffect, useCallback } from 'react';
import 'date-fns';

import Grid from '@material-ui/core/Grid';
import { lighten, makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Paper from '@material-ui/core/Paper';


import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import { useForm, Controller } from "react-hook-form";
import Api from "../../common/api";

import AsyncAutocomplete from "../form/async-autocomplete.component";

import './compare_table_styles.css'


export default function CompareFormComponent({documents}) {

    const useStyles = makeStyles({
      table: {
        minWidth: 650,
      },
    });

    const classes = useStyles();

      return (
        <TableContainer component={Paper}>
          <Table className={classes.table} aria-label="simple table">
            <TableHead class='table-head'>
              <TableRow>
                { documents.map((doc) => 
                    <TableCell class='table-cell'>{doc.country}</TableCell>
                )}
              </TableRow>
              <TableRow>
                { documents.map((doc) => 
                    <TableCell class='table-cell'>{doc.section}</TableCell>
                )}
              </TableRow>
              <TableRow>
                { documents.map((doc) => 
                    <TableCell class='table-cell'>{doc.organization}</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow class='text-row'>
                { documents.map((doc) => 
                    <TableCell class='table-cell'>{doc.original_text}</TableCell>
                )}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      );
}
