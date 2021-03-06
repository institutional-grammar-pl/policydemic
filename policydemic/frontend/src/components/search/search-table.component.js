import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { lighten, makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import Grid from '@material-ui/core/Grid';


import { Container } from '@material-ui/core';

import DeleteIcon from '@material-ui/icons/Delete';
import CloudDownloadIcon from '@material-ui/icons/CloudDownload';
import EditIcon from '@material-ui/icons/Edit';
import DeleteConfirmationDialogComponent from './delete-dialog.component.js';
import CompareTabDialogComponent from '../compare/compare-tab-dialog.component.js';
import UploadComponent from '../form/upload.component';


import Api from '../../common/api.js';


function descendingComparator(a, b, orderBy) 
{
    if (b[orderBy] < a[orderBy]) {
        return -1;
    }
    if (b[orderBy] > a[orderBy]) {
        return 1;
    }
    return 0;
}

function getComparator(order, orderBy) {

    return order === 'desc'
        ? (a, b) => descendingComparator(a, b, orderBy)
        : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
        const order = comparator(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
}

const headCells = {
    "LAD" : [
        { id: 'title', alignLeft: false, label: 'Title' },
        { id: 'info_date', alignLeft: false, label: 'Info date' },
        { id: 'country', alignLeft: false, label: 'Country' }
    ], 
    "SSD": [
        { id: 'title', alignLeft: false, label: 'Title' },
        { id: 'info_date', alignLeft: false, label: 'Info date' },
        { id: 'section', alignLeft: false, label: 'Section' },
        { id: 'organization', alignLeft: false, label: 'Organization'},  
        { id: 'country', alignLeft: false, label: 'Country' },
    ]
}

console.log('headCells')

function EnhancedTableHead(props) {
    const { classes, onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort } = props;
    const createSortHandler = (property) => (event) => {
        onRequestSort(event, property);
    };

    console.log('headCells', headCells)
    console.log(props.documentType)
    return (
        <TableHead>
            <TableRow>
                <TableCell padding="checkbox">
                    <Checkbox
                        indeterminate={numSelected > 0 && numSelected < rowCount}
                        checked={rowCount > 0 && numSelected === rowCount}
                        onChange={onSelectAllClick}
                        inputProps={{ 'aria-label': 'select all desserts' }}
                    />
                </TableCell>
                {headCells[props.documentType].map((headCell) => (
                    <TableCell
                        key={headCell.id}
                        align={headCell.alignLeft ? 'right' : 'left'}
                        padding='default'
                        sortDirection={orderBy === headCell.id ? order : false}
                    >
                        <TableSortLabel
                            active={orderBy === headCell.id}
                            direction={orderBy === headCell.id ? order : 'asc'}
                            onClick={createSortHandler(headCell.id)}
                        >
                            {headCell.label}

                            {orderBy === headCell.id ? (
                                <span className={classes.visuallyHidden}>
                                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                </span>
                            ) : null}
                        </TableSortLabel>
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>
    );
}

EnhancedTableHead.propTypes = {
    classes: PropTypes.object.isRequired,
    numSelected: PropTypes.number.isRequired,
    onRequestSort: PropTypes.func.isRequired,
    onSelectAllClick: PropTypes.func.isRequired,
    order: PropTypes.oneOf(['asc', 'desc']).isRequired,
    orderBy: PropTypes.string.isRequired,
    rowCount: PropTypes.number.isRequired,
};

const useToolbarStyles = makeStyles((theme) => ({
    root: {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(1),
    },
    highlight:
        theme.palette.type === 'light'
            ? {
                color: theme.palette.secondary.main,
                backgroundColor: lighten(theme.palette.secondary.light, 0.85),
            }
            : {
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.secondary.dark,
            },
    title: {
        flex: '1 1 100%',
    },
}));

const EnhancedTableToolbar = (props) => {
    const classes = useToolbarStyles();
    const { numSelected, tableTitle } = props;

    return (
        <Toolbar
            className={clsx(classes.root, {
                [classes.highlight]: numSelected > 0,
            })}
        >
            {numSelected > 0 ? (
                <Typography className={classes.title} color="inherit" variant="subtitle1" component="div">
                    {numSelected} selected
                </Typography>
            ) : (
                    <Typography className={classes.title} variant="h6" id="tableTitle" component="div">
                        {tableTitle}
                    </Typography>
                )}

            {numSelected > 0 ? (

                <Container
                    style={{ display: 'flex', justifyContent: 'right' }}
                >

                    {(props.documentType==='SSD') && (<Tooltip title="Compare Selected" >
                        <IconButton aria-label="compare" onClick={(event) => props.onCompareSelectedClick(event)}>
                            <CloudDownloadIcon />
                        </IconButton>
                    </Tooltip> )}

                    <Tooltip title="Delete">
                        <IconButton aria-label="delete" onClick={(event) => props.onDeleteClick(event)}>
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>


                </Container>

            ) : <Container
                style={{ display: 'flex', justifyContent: 'right' }}
            >
            </Container>}        
        </Toolbar>
    );
};


EnhancedTableToolbar.propTypes = {
    numSelected: PropTypes.number.isRequired,
    onUploadJSONClick: PropTypes.func.isRequired,
    onAddNewItemClick: PropTypes.func.isRequired,
    onCompareSelectedClick: PropTypes.func.isRequired,
    onDeleteClick: PropTypes.func.isRequired,
};

const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
    },
    paper: {
        width: '100%',
        marginBottom: theme.spacing(2),
    },
    table: {
        minWidth: 750,
    },
    visuallyHidden: {
        border: 0,
        clip: 'rect(0 0 0 0)',
        height: 1,
        margin: -1,
        overflow: 'hidden',
        padding: 0,
        position: 'absolute',
        top: 20,
        width: 1,
    },
}));

export default function EnhancedTable(props) {

    const { tableTitle, rows, onDelete, onEdit } = props;

    console.log('rows', rows)

    const classes = useStyles();
    const [order, setOrder] = React.useState('asc');
    const [orderBy, setOrderBy] = React.useState('calories');
    const [selected, setSelected] = React.useState([], );
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(5); 
    const [comparingIds, setComparingIds] = React.useState(); 
    const [uploaded, setUploaded] = React.useState(false);

    
    const [deleteDialogVisible, setDeleteDialogVisible] = React.useState(false);

    React.useEffect(() => {
        setSelected([]);
    }, [props.rows]);

    const handleRequestSort = (event, property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            const newSelecteds = rows.map((n) => n.id);
            setSelected(newSelecteds);
            return;
        }
        setSelected([]);
    };

    const handleClick = (event, name) => {
        const selectedIndex = selected.indexOf(name);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, name);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1),
            );
        }

        setSelected(newSelected);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const isSelected = (id) => selected.indexOf(id) !== -1;

    const emptyRows = rowsPerPage - Math.min(rowsPerPage, rows.length - page * rowsPerPage);

    const uploadJsonButtonClicked = (event) => {
        alert("upload json");
    };

    const addNewItemButtonClicked = (event) => {
        props.onAddNewItemClick()
    }

    const downloadSelectedButtonClicked = (event) => {
        alert("download items: " + selected);
    };

    const onCompareSelectedClick = (event) => {
        setComparingIds(selected)
    }



    return (
        <div>
        { comparingIds && (
            <CompareTabDialogComponent open={comparingIds} documentIds={comparingIds} onClose={()=> setComparingIds()}/>
        )}
        <DeleteConfirmationDialogComponent
            dialogVisible={deleteDialogVisible}
            onDeleteExecute={() => {
                onDelete(selected);
                setDeleteDialogVisible(false);}}
            onDeleteCancelExecute={() => setDeleteDialogVisible(false)}
        />
        <Container className={classes.root}>
            <Paper className={classes.paper}>
                <EnhancedTableToolbar
                    documentType={props.documentType}
                    numSelected={selected.length}
                    tableTitle={tableTitle}
                    onUploadJSONClick={uploadJsonButtonClicked}
                    onAddNewItemClick={addNewItemButtonClicked}
                    onDownloadSelectedClick={downloadSelectedButtonClicked}
                    onCompareSelectedClick={onCompareSelectedClick}
                    onDeleteClick={() => setDeleteDialogVisible(true)}
                />
                <TableContainer>
                    <Table
                        className={classes.table}
                        aria-labelledby="tableTitle"
                        size='small'
                        aria-label="enhanced table"
                    >
                        <EnhancedTableHead
                            documentType={props.documentType}
                            classes={classes}
                            numSelected={selected.length}
                            order={order}
                            orderBy={orderBy}
                            onSelectAllClick={handleSelectAllClick}
                            onRequestSort={handleRequestSort}
                            rowCount={rows.length}
                        />
                        <TableBody>
                            {stableSort(rows, getComparator(order, orderBy))
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((row, index) => {
                                    const isItemSelected = isSelected(row.id);
                                    const labelId = `enhanced-table-checkbox-${index}`;

                                    if (row.info_date === "1900-01-01") {
                                        row.info_date = "-"
                                    }

                                    return (
                                        <TableRow
                                            hover
                                            onClick={(event) => handleClick(event, row.id)}
                                            role="checkbox"
                                            aria-checked={isItemSelected}
                                            tabIndex={-1}
                                            key={row.id}
                                            selected={isItemSelected}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={isItemSelected}
                                                    inputProps={{ 'aria-labelledby': labelId }}
                                                />
                                            </TableCell>
                                            <TableCell align="left">{row.title}</TableCell>
                                            <TableCell align="left">{row.info_date}</TableCell>
                                            {(props.documentType === 'SSD') && (
                                                <TableCell align="left">{row.section}</TableCell>
                                            )}
                                            {(props.documentType === 'SSD') && (
                                                <TableCell align="left">{row.organization}</TableCell>
                                            )}

                                            <TableCell align="left">{row.country}</TableCell>

                                            <TableCell align="left">
                                                <Tooltip title="Edit">
                                                    <IconButton aria-label="edit" onClick={(event) => { event.stopPropagation(); onEdit(row.id); }}>
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            {emptyRows > 0 && (
                                <TableRow style={{ height: 35 * emptyRows }}>
                                    <TableCell colSpan={6} />
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component={Container}
                    count={rows.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onChangePage={handleChangePage}
                    onChangeRowsPerPage={handleChangeRowsPerPage}
                />
            </Paper>
        </Container>

        {(props.documentType==='LAD') && (<Container>
            <UploadComponent name="uploadFile" setValue={function(_, file) {
                Api.uploadFile(file).then((resp) => {
                    console.log('resp', resp)
                    console.log(resp.request.status)
                    if (resp.request.status === 200) {
                        setUploaded(true)
                    } 
                }).catch((resp) => {
                    console.log('catch resp', resp.response.data)
                    setUploaded(resp.response.data)
                })
            }}/>
            <Grid item xs={5}>

            {(uploaded === true) && (<Typography variant="body2" component="p" style={{"marginTop":'19px', 'marginLeft':'2em'}}>
                            Document uploaded!
                        </Typography>
                        )}
            {(typeof uploaded == 'string') &&  (<Typography variant="body2" component="p" style={{"marginTop":'19px', 'marginLeft':'2em', 'color': 'red'}}>
                            {uploaded}
                        </Typography>)
                }
            </Grid>
        </Container>)}

        </div>

    );
}