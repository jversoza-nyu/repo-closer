var express = require('express');
var router = express.Router();
var schedule = require('node-schedule');
var childProcess = require('child_process');
var fs = require('fs');
var path = require('path');
var config = JSON.parse(fs.readFileSync(path.join(__dirname, '/../config.json')));

require('../db');

// mongoose setup
const mongoose = require('mongoose');
const ScheduledRepoClosing = mongoose.model('ScheduledRepoClosing');

const debug = true;

/*
  call a script to close the repositories
*/
function closeRepositories(action, orgName, repoName, apiToken) {
  var args = [action, orgName, repoName, apiToken];
  childProcess.fork(__dirname + '/../modify-repositories-script.js', args);
}

/*
  create a new scheduled repo closing entry
*/
router.post('/confirm', function(req,res) {
  // schedule a repo closing here
  var organizationName = req.body.organizationName;
  var homeworkName = req.body.homeworkName;
  var closingDate = req.body.closingDate;
  var closingTime = req.body.closingTime;

  var apiKey = req.body.password;
  var storedToken = config.token;

  if(storedToken === apiKey) {
      var date = new Date(closingDate + " " + closingTime);
      var localeDateString = date.toLocaleString();
      var dateTokenized = localeDateString.split(',');

      const scheduledRepoClosing = new ScheduledRepoClosing({
        organization: organizationName,
        homeworkPrefix: homeworkName,
        closeAt: date
      });

      scheduledRepoClosing.save(function(err,object,count){
        if(err){
          res.send(err);
        } else {
          if(debug) {
            console.log("successfully added a scheduled repo closing object to database with id " + object._id);
          }
          var string = "job-id:" + object._id;
          // schedule to execute some code to close the repo
          var job = schedule.scheduleJob(string, date, function(objectID, action, orgName, repoName, apiKey){
            console.log("running repo closing script...");

            closeRepositories(action, orgName, repoName, apiKey);
            ScheduledRepoClosing.find({_id: objectID}).remove().exec();
          }.bind(null, object._id, 'close', organizationName, homeworkName, apiKey));

          if(debug) {
            console.log('repos closing scheduled with unique job name ' + string);
          }
          var obj = {'homeworkName': homeworkName, 'closingDate': dateTokenized[0], 'closingTime': dateTokenized[1]};
          res.render('confirm',obj);
        }
      });
  } else {
    // re-render with an error display
    var obj = {'shouldDisplayError': true}
    res.render('index', obj);
  }
});

module.exports = router;