import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import BlocklyWindow from '../Blockly/BlocklyWindow';
import SolutionCheck from './SolutionCheck';
import CodeViewer from '../CodeViewer';

import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import Typography from '@material-ui/core/Typography';

class Assessment extends Component {

  render() {
    var tutorialId = this.props.currentTutorialId;
    var steps = this.props.steps;
    var currentTask = this.props.step;
    var tasks = steps.filter(task => task.type === 'task');
    var taskIndex = tasks.indexOf(currentTask);
    var status = this.props.status.filter(status => status.id === tutorialId)[0];
    var statusTask = status.tasks[taskIndex]

    return (
      <div style={{width: '100%'}}>
        <Typography variant='h4' style={{marginBottom: '5px'}}>{currentTask.headline}</Typography>
        <Grid container spacing={2} style={{marginBottom: '5px'}}>
          <Grid item xs={12} md={6} lg={8} style={{ position: 'relative' }}>
            <SolutionCheck />
            <BlocklyWindow initialXml={statusTask.xml ? statusTask.xml : null}/>
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <Card style={{height: 'calc(50% - 30px)', padding: '10px', marginBottom: '10px'}}>
              <Typography variant='h5'>Arbeitsauftrag</Typography>
              <Typography>{currentTask.text1}</Typography>
            </Card>
            <div style={{height: '50%'}}>
              <CodeViewer />
            </div>
          </Grid>
        </Grid>
      </div>
    );
  };
}

Assessment.propTypes = {
  currentTutorialId: PropTypes.number,
  status: PropTypes.array.isRequired,
  change: PropTypes.number.isRequired
};

const mapStateToProps = state => ({
  change: state.tutorial.change,
  status: state.tutorial.status,
  currentTutorialId: state.tutorial.currentId
});

export default connect(mapStateToProps, null)(Assessment);