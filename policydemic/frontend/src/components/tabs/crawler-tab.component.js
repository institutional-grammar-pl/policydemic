import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import {
  KeyboardTimePicker,
  KeyboardDatePicker,
  DatePicker,
  MuiPickersUtilsProvider,
} from "@material-ui/pickers";
import DateFnsUtils from "@date-io/date-fns";
import {
  Container,
  Grid,
  Select,
  MenuItem,
  InputLabel,
  Switch,
  TextField,
  Button,
} from "@material-ui/core";
import SendIcon from "@material-ui/icons/Send";
import Api from "../../common/api";

const useStyles = makeStyles((theme) => ({
  select: {
    width: "100%",
    textAlign: "left",
  },
  label: {
    textAlign: "left",
  },
  section: {
    margin: "30px 0 20px 30px",
  },
}));

export default function CrawlerConfigTabComponent() {
  const classes = useStyles();

  const today = new Date();
  const [urlDomain, setUrlDomain] = useState("https://en.unesco.org");

  const prepareState = () => {
    return {
      urlDomain
    };
  };

  const runCrawler = () => {
    const config = prepareState();

    Api.runCrawler(config).catch(() =>
      console.log("error encountered while running crawler")
    );
  };

  return (
    <Container>
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <Grid container direction="column">
          {/* Crawler section  */}
          <Grid item>
            <Typography className={classes.label} variant="h4">
              Crawler
            </Typography>
          </Grid>
          {/* Section search criteria */}
          <Grid item>
            <Typography className={classes.label} variant="h6">
              Search criteria
            </Typography>
          </Grid>
          <Grid
            container
            justify="space-between"
            spacing={4}
            className={classes.section}
          >
            <Grid item xs={10}>
              <TextField
                value={urlDomain}
                onChange={(e) => setUrlDomain(e.target.value)}
                label="Website"
                placeholder="Enter website"
              />
            </Grid>
          </Grid>
          <Grid container justify="flex-end" spacing={4}>
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                endIcon={<SendIcon />}
                onClick={runCrawler}
              >
                Run now
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </MuiPickersUtilsProvider>
    </Container>
  );
}