import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { checkError, readJSON, jsonString, progress, tutorialId, resetTutorial as resetTutorialBuilder} from '../../../actions/tutorialBuilderActions';
import { getTutorials, resetTutorial} from '../../../actions/tutorialActions';
import { clearMessages } from '../../../actions/messageActions';

import axios from 'axios';
import { withRouter } from 'react-router-dom';

import { saveAs } from 'file-saver';
import { detectWhitespacesAndReturnReadableResult } from '../../../helpers/whitespace';

import Breadcrumbs from '../../Breadcrumbs';
import Textfield from './Textfield';
import Step from './Step';
import Dialog from '../../Dialog';
import Snackbar from '../../Snackbar';

import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Backdrop from '@material-ui/core/Backdrop';
import CircularProgress from '@material-ui/core/CircularProgress';
import Divider from '@material-ui/core/Divider';
import FormHelperText from '@material-ui/core/FormHelperText';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';

const styles = (theme) => ({
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
  },
  errorColor: {
    color: theme.palette.error.dark
  }
});

class Builder extends Component {

  constructor(props) {
    super(props);
    this.state = {
      tutorial: 'new',
      open: false,
      title: '',
      content: '',
      string: false,
      snackbar: false,
      key: '',
      message: ''
    };
    this.inputRef = React.createRef();
  }

  componentDidMount() {
    this.props.getTutorials();
  }

  componentDidUpdate(props, state) {
    if(this.props.message.id === 'GET_TUTORIALS_FAIL'){
      alert(this.props.message.msg);
      this.props.clearMessages();
    }
  }

  componentWillUnmount() {
    this.resetFull();
    this.props.resetTutorial();
    if(this.props.message.msg){
      this.props.clearMessages();
    }
  }

  uploadJsonFile = (jsonFile) => {
    this.props.progress(true);
    if (jsonFile.type !== 'application/json') {
      this.props.progress(false);
      this.setState({ open: true, string: false, title: 'Unzulässiger Dateityp', content: 'Die übergebene Datei entspricht nicht dem geforderten Format. Es sind nur JSON-Dateien zulässig.' });
    }
    else {
      var reader = new FileReader();
      reader.readAsText(jsonFile);
      reader.onloadend = () => {
        this.readJson(reader.result, true);
      };
    }
  }

  uploadJsonString = () => {
    this.setState({ open: true, string: true, title: 'JSON-String einfügen', content: '' });
  }

  readJson = (jsonString, isFile) => {
    try {
      var result = JSON.parse(jsonString);
      if (!this.checkSteps(result.steps)) {
        result.steps = [{}];
      }
      this.props.readJSON(result);
      this.setState({ snackbar: true, key: Date.now(), message: `${isFile ? 'Die übergebene JSON-Datei' : 'Der übergebene JSON-String'} wurde erfolgreich übernommen.`, type: 'success' });
    } catch (err) {
      this.props.progress(false);
      this.props.jsonString('');
      this.setState({ open: true, string: false, title: 'Ungültiges JSON-Format', content: `${isFile ? 'Die übergebene Datei' : 'Der übergebene String'} enthält nicht valides JSON. Bitte überprüfe ${isFile ? 'die JSON-Datei' : 'den JSON-String'} und versuche es erneut.` });
    }
  }

  checkSteps = (steps) => {
    if (!(steps && steps.length > 0)) {
      return false;
    }
    return true;
  }

  toggle = () => {
    this.setState({ open: !this.state });
  }

  onChange = (value) => {
    this.props.resetTutorialBuilder();
    this.props.tutorialId('');
    this.setState({tutorial: value});
  }

  onChangeId = (value) => {
    this.props.tutorialId(value);
    this.props.progress(true);
    var tutorial = this.props.tutorials.filter(tutorial => tutorial._id === value)[0];
    this.props.readJSON(tutorial);
    this.setState({ snackbar: true, key: Date.now(), message: `Das ausgewählte Tutorial "${tutorial.title}" wurde erfolgreich übernommen.`, type: 'success' });
  }

  resetFull = () => {
    this.props.resetTutorialBuilder();
    this.setState({ snackbar: true, key: Date.now(), message: `Das Tutorial wurde erfolgreich zurückgesetzt.`, type: 'success' });
    window.scrollTo(0, 0);
  }

  resetTutorial = () => {
    var tutorial = this.props.tutorials.filter(tutorial => tutorial._id === this.props.id)[0];
    this.props.readJSON(tutorial);
    this.setState({ snackbar: true, key: Date.now(), message: `Das Tutorial ${tutorial.title} wurde erfolgreich auf den ursprünglichen Stand zurückgesetzt.`, type: 'success' });
    window.scrollTo(0, 0);
  }

  submit = () => {
    var isError = this.props.checkError();
    if (isError) {
      this.setState({ snackbar: true, key: Date.now(), message: `Die Angaben für das Tutorial sind nicht vollständig.`, type: 'error' });
      window.scrollTo(0, 0);
      return false;
    }
    else {
      // export steps without attribute 'url'
      var steps = this.props.steps;
      var newTutorial = new FormData();
      newTutorial.append('title', this.props.title);
      steps.forEach((step, i) => {
        newTutorial.append(`steps[${i}][type]`, step.type);
        newTutorial.append(`steps[${i}][headline]`, step.headline);
        newTutorial.append(`steps[${i}][text]`, step.text);
        if(i === 0 && step.type === 'instruction'){
          if(step.requirements){ // optional
            step.requirements.forEach((requirement, j) => {
              newTutorial.append(`steps[${i}][requirements][${j}]`, requirement);
            });
          }
          step.hardware.forEach((hardware, j) => {
            newTutorial.append(`steps[${i}][hardware][${j}]`, hardware);
          });
        }
        if(step.xml){ // optional
          newTutorial.append(`steps[${i}][xml]`, step.xml);
        }
        if(step.media){ // optional
          if(step.media.youtube){
            newTutorial.append(`steps[${i}][media][youtube]`, step.media.youtube);
          }
          if(step.media.picture){
            newTutorial.append(`steps[${i}][media][picture]`, step.media.picture);
          }
        }
      });
      return newTutorial;
    }
  }

  submitNew = () => {
    var newTutorial = this.submit();
    if(newTutorial){
      axios.post(`${process.env.REACT_APP_BLOCKLY_API}/tutorial/`, newTutorial)
        .then(res => {
          var tutorial = res.data.tutorial;
          this.props.history.push(`/tutorial/${tutorial._id}`);
        })
        .catch(err => {
          this.setState({ snackbar: true, key: Date.now(), message: `Fehler beim Erstellen des Tutorials. Versuche es noch einmal.`, type: 'error' });
          window.scrollTo(0, 0);
        });
    }
  }

  submitUpdate = () => {
    var updatedTutorial = this.submit();
    if(updatedTutorial){
      axios.put(`${process.env.REACT_APP_BLOCKLY_API}/tutorial/${this.props.id}`, updatedTutorial)
        .then(res => {
          var tutorial = res.data.tutorial;
          this.props.history.push(`/tutorial/${tutorial._id}`);
        })
        .catch(err => {
          this.setState({ snackbar: true, key: Date.now(), message: `Fehler beim Ändern des Tutorials. Versuche es noch einmal.`, type: 'error' });
          window.scrollTo(0, 0);
        });
    }
  }

  render() {
    return (
      <div>
        <Breadcrumbs content={[{ link: '/tutorial', title: 'Tutorial' }, { link: '/tutorial/builder', title: 'Builder' }]} />

        <h1>Tutorial-Builder</h1>

        <RadioGroup row value={this.state.tutorial} onChange={(e) => this.onChange(e.target.value)}>
          <FormControlLabel style={{color: 'black'}}
            value="new"
            control={<Radio color="primary" />}
            label="neues Tutorial erstellen"
            labelPlacement="end"
          />
          <FormControlLabel style={{color: 'black'}}
            disabled={this.props.index === 0}
            value="change"
            control={<Radio color="primary" />}
            label="bestehendes Tutorial ändern"
            labelPlacement="end"
          />
        </RadioGroup>

        <Divider variant='fullWidth' style={{ margin: '10px 0 15px 0' }} />

        {this.state.tutorial === 'new' ?
          /*upload JSON*/
          <div ref={this.inputRef}>
            <input
              style={{ display: 'none' }}
              accept="application/json"
              onChange={(e) => { this.uploadJsonFile(e.target.files[0]) }}
              id="open-json"
              type="file"
            />
            <label htmlFor="open-json">
              <Button component="span" style={{ marginRight: '10px', marginBottom: '10px' }} variant='contained' color='primary'>Datei laden</Button>
            </label>
            <Button style={{ marginRight: '10px', marginBottom: '10px' }} variant='contained' color='primary' onClick={() => this.uploadJsonString()}>String laden</Button>
          </div>
        : <FormControl variant="outlined" style={{width: '100%'}}>
            <InputLabel id="select-outlined-label">Tutorial</InputLabel>
            <Select
              color='primary'
              labelId="select-outlined-label"
              defaultValue={this.props.id}
              onChange={(e) => this.onChangeId(e.target.value)}
              label="Tutorial"
            >
              {this.props.tutorials.map(tutorial =>
                <MenuItem value={tutorial._id}>{tutorial.title}</MenuItem>
              )}
            </Select>
          </FormControl>
        }

        <Divider variant='fullWidth' style={{ margin: '10px 0 15px 0' }} />

        {this.state.tutorial === 'new' || (this.state.tutorial === 'change' && this.props.id !== '') ?
        /*Tutorial-Builder-Form*/
        <div>
          {this.props.error.type ?
            <FormHelperText style={{ lineHeight: 'initial' }} className={this.props.classes.errorColor}>{`Ein Tutorial muss mindestens jeweils eine Instruktion und eine Aufgabe enthalten.`}</FormHelperText>
            : null}
          {/* <Id error={this.props.error.id} value={this.props.id} /> */}
          <Textfield value={this.props.title} property={'title'} label={'Titel'} error={this.props.error.title} />

          {this.props.steps.map((step, i) =>
            <Step step={step} index={i} key={i} />
          )}

          {/*submit or reset*/}
          <Divider variant='fullWidth' style={{ margin: '30px 0 10px 0' }} />
          {this.state.tutorial === 'new' ?
            <div>
              <Button style={{ marginRight: '10px', marginTop: '10px' }} variant='contained' color='primary' onClick={() => this.submitNew()}>Tutorial erstellen</Button>
              <Button style={{ marginTop: '10px' }} variant='contained' onClick={() => this.resetFull()}>Zurücksetzen</Button>
            </div>
          : <div>
            <Button style={{ marginRight: '10px', marginTop: '10px' }} variant='contained' color='primary' onClick={() => this.submitUpdate()}>Tutorial ändern</Button>
            <Button style={{ marginTop: '10px' }} variant='contained' onClick={() => this.resetTutorial()}>Zurücksetzen</Button>
          </div>
          }

          <Backdrop className={this.props.classes.backdrop} open={this.props.isProgress}>
            <CircularProgress color="inherit" />
          </Backdrop>
        </div>
        : null}

        <Dialog
          open={this.state.open}
          maxWidth={this.state.string ? 'md' : 'sm'}
          fullWidth={this.state.string}
          title={this.state.title}
          content={this.state.content}
          onClose={this.toggle}
          onClick={this.toggle}
          button={'Schließen'}
          actions={
            this.state.string ?
              <div>
                <Button disabled={this.props.error.json || this.props.json === ''} variant='contained' onClick={() => { this.toggle(); this.props.progress(true); this.readJson(this.props.json, false); }} color="primary">Bestätigen</Button>
                <Button onClick={() => { this.toggle(); this.props.jsonString(''); }} color="primary">Abbrechen</Button>
              </div>
              : null
          }
        >
          {this.state.string ?
            <Textfield value={this.props.json} property={'json'} label={'JSON'} multiline error={this.props.error.json} />
            : null}
        </Dialog>

        <Snackbar
          open={this.state.snackbar}
          message={this.state.message}
          type={this.state.type}
          key={this.state.key}
        />

      </div>
    );
  };
}

Builder.propTypes = {
  getTutorials: PropTypes.func.isRequired,
  resetTutorial: PropTypes.func.isRequired,
  clearMessages: PropTypes.func.isRequired,
  checkError: PropTypes.func.isRequired,
  tutorialId: PropTypes.func.isRequired,
  readJSON: PropTypes.func.isRequired,
  jsonString: PropTypes.func.isRequired,
  progress: PropTypes.func.isRequired,
  resetTutorialBuilder: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  steps: PropTypes.array.isRequired,
  change: PropTypes.number.isRequired,
  error: PropTypes.object.isRequired,
  json: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  isProgress: PropTypes.bool.isRequired,
  tutorials: PropTypes.array.isRequired,
  message: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  title: state.builder.title,
  id: state.builder.id,
  steps: state.builder.steps,
  change: state.builder.change,
  error: state.builder.error,
  json: state.builder.json,
  isProgress: state.builder.progress,
  tutorials: state.tutorial.tutorials,
  message: state.message
});

export default connect(mapStateToProps, { checkError, readJSON, jsonString, progress, tutorialId, resetTutorialBuilder, getTutorials, resetTutorial, clearMessages })(withStyles(styles, { withTheme: true })(withRouter(Builder)));
