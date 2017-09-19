var express = require('express');
var router = express.Router();

require('../db');

// mongoose setup
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const ScheduledRepoClosing = mongoose.model('ScheduledRepoClosing');

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/confirm', function(req,res) {
  // schedule a repo closing here
  console.log(req.body);

  var organizationName = req.body.organizationName;
  var homeworkName = req.body.homeworkName;
  var closingDate = req.body.closingDate;
  var closingTime = req.body.closingTime;

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
      console.log("successfully added a scheduled repo closing object to database with id" + object._id);

      var obj = {'homeworkName': homeworkName, 'closingDate': dateTokenized[0], 'closingTime': dateTokenized[1]};
      res.render('confirm',obj);
    }
  });
});

router.post('/confirm-update', function(req,res) {
  console.log(req.body);

  var organizationName = req.body.organizationNameEdited;
  var homeworkName = req.body.homeworkNameEdited;
  var closingDate = req.body.submissionDateEdited;
  var closingTime = req.body.submissionTimeEdited;

  var date = new Date(closingDate + " " + closingTime);
  var localeDateString = date.toLocaleString();
  var dateTokenized = localeDateString.split(',');

  var newData = {
    organization: organizationName,
    homeworkPrefix: homeworkName,
    closeAt: date
  };
  console.log(newData);

  ScheduledRepoClosing.findOneAndUpdate({'organization':organizationName, 'homeworkPrefix': homeworkName}, newData, function(err, doc){
    if (err) return res.sendStatus(err);
    console.log('successfully saved');

    var obj = {'homeworkName': homeworkName, 'closingDate': dateTokenized[0], 'closingTime': dateTokenized[1]};
    res.render('confirm-update',obj);
  });

});

router.get('/scheduled/view', function(req,res) {
  var obj = {};
  var listOfSchedules = [];
  ScheduledRepoClosing.find(function(err, schedules, count) {
    schedules.forEach(function(ele) {
      console.log(ele);
      var singleObj = {'organizationName': ele.organization, 'homeworkName': ele.homeworkPrefix};
      var closingDate = ele.closeAt;
      var localeDateString = closingDate.toLocaleString();
      singleObj['closingDateTime'] = localeDateString;

      listOfSchedules.push(singleObj);
    });
    obj['schedules'] = listOfSchedules;
    res.render('view-scheduled', obj);
  });
});

router.get('/scheduled/edit/:id', function(req,res) {
  var scheduledClosingID = req.params.id;
  console.log(scheduledClosingID);
  var obj = {};
  var listOfSchedules = [];
  ScheduledRepoClosing.findOne({_id: scheduledClosingID}, function(err, scheduled, count) {
    console.log("found one scheduled object");
    console.log(scheduled);
    obj['organizationName'] = scheduled.organization;
    obj['homeworkName'] = scheduled.homeworkPrefix;
    var date = scheduled.closeAt;

    var month = date.getMonth() + 1;
    var monthString = "";
    if(month <= 9) {
      monthString = "0" + month;
    } else {
      monthString = "" + month;
    }
    var dateString = date.getFullYear() + "-" + monthString + "-" + date.getDate(); // YYYY-MM-DD

    var hoursString = date.getHours() <= 9 ? "0" + date.getHours() : date.getHours();
    var minutesString = date.getMinutes() <= 9 ? "0" + date.getMinutes() : date.getMinutes();

    var timeString = hoursString + ":" + minutesString;

    obj['dateToClose'] = dateString;
    obj['timeToClose'] = timeString;

    res.render('edit-scheduled-single', obj);
  });
});

router.post('/confirm-delete', function(req,res) {
  var scheduledRepoClosingID = req.body.repoClosingScheduleIdentifier;
  ScheduledRepoClosing.find({_id: scheduledRepoClosingID }).remove().exec();
  console.log('deleted scheduled repo closing');
  res.render('confirm-delete');
});

router.get('/scheduled/delete', function(req,res) {
  var obj = {};
  var listOfSchedules = [];
  ScheduledRepoClosing.find(function(err, schedules, count) {
    schedules.forEach(function(ele) {
      console.log(ele);
      var summaryString = "[" + ele.organization + "] " + ele.homeworkPrefix;
      var singleObj = {'scheduleName': summaryString, 'scheduleID': ele._id};

      listOfSchedules.push(singleObj);
    });
    obj['schedules'] = listOfSchedules;
    res.render('delete-scheduled', obj);
  });
});

router.get('/scheduled/edit', function(req,res) {
  var obj = {};
  var listOfSchedules = [];
  ScheduledRepoClosing.find(function(err, schedules, count) {
    schedules.forEach(function(ele) {
      console.log(ele);
      var summaryString = "[" + ele.organization + "] " + ele.homeworkPrefix;
      var singleObj = {'scheduleName': summaryString, 'scheduleID': ele._id};

      listOfSchedules.push(singleObj);
    });
    obj['schedules'] = listOfSchedules;
    res.render('edit-scheduled', obj);
  });
});

module.exports = router;