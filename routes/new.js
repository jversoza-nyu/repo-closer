const express = require('express');
const router = express.Router();
const schedule = require('node-schedule');
const childProcess = require('child_process');

require('../db');

// mongoose setup
const mongoose = require('mongoose');
const ScheduledRepoClosing = mongoose.model('ScheduledRepoClosing');

// debug flag
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
router.post('/confirm', authenticated, function(req,res) {
  // schedule a repo closing here
  var organizationName = req.body.organizationName;
  var homeworkName = req.body.homeworkName;
  var closingDate = req.body.closingDate;
  var closingTime = req.body.closingTime;

  var apiKey = req.user.key; // api key to use to close the repositories

  var date = new Date(closingDate + " " + closingTime);
  var localeDateString = date.toLocaleString();
  var dateTokenized = localeDateString.split(',');

  const scheduledRepoClosing = new ScheduledRepoClosing({
    ownerId: req.user._id,
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
      var job = schedule.scheduleJob(string, date, function(objectID, action, orgName, repoName, apiKey) {
        console.log("running repo closing script...");

        // call the script to close this repo for given org
        closeRepositories(action, orgName, repoName, apiKey);
        // remove the repo closing from database since its been closed
        ScheduledRepoClosing.find(
          {
            _id: objectID
          }
        ).remove().exec();
      }.bind(null, object._id, 'close', organizationName, homeworkName, apiKey));

      if(debug) {
        console.log('repos closing scheduled with unique job name ' + string);
      }

      // message for UI
      var message = {};
      message["title"] = "All Set.";
      var messageBody = "The repositories for " + homeworkName + " are set to close on " + dateTokenized[0] + " at " + dateTokenized[1] + ".";
      message["body"] = messageBody;

      req.session.message = message;
      res.redirect('/scheduled/view');
    }
  });
});

/*
  middleware helper function to ensure user is autheticated for any chosen particular route
*/
function authenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.locals.message = "error";
  res.redirect('/');
}

module.exports = router;
