var mongoose   = require('mongoose');
var express = require('express');     // call express
var app = express();                 // define our app using express
var bodyParser = require('body-parser');
var morgan      = require('morgan');
var jwt    = require('jsonwebtoken')
var config = require('./config'); // get our config file
var Student = require('./app/models/student');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var port = process.env.PORT || 4000;        // set the port
mongoose.connect('mongodb://localhost/students');    //Connect to database
app.set('superSecret', config.secret);

app.use(morgan('dev'));                   // use morgan to log requests to the console

var router = express.Router();              // get an instance of the express Router

// middleware to use for all requests
router.use(function(req, res, next) {
    console.log('Connection status: ' + mongoose.connection.readyState) //Conecction state
    next();             // make sure we go to the next routes and don't stop here
});

// test route to make sure everything is working (
router.get('/', function(req, res) {
    res.status(200).json({ message: 'Welcome to the Rest API' });
});


router.post('/authenticate', function(req, res) {

  // find the student
  Student.findOne({
    name: req.body.name
  }, function(err, student) {

    if (err) throw err;

    if (!student) {
      res.status(401).json({ success: false, message: 'Authentication failed. Student not found.' });
    } else if (student) {

      // check if password matches
      if (student.password != req.body.password) {
        res.status(401).json({ success: false, message: 'Authentication failed. Wrong password.' });
      } else {

        // if student is found and password is right
        // create a token
        var token = jwt.sign(student, app.get('superSecret'), {
          expiresInMinutes: 1440 // expires in 24 hours
        });

        // return the information including token as JSON
        res.status(200).json({
          success: true,
          token: token
        });
      }

    }

  });
});

// route middleware to verify a token
router.use(function(req, res, next) {

  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  // decode token
  if (token) {

    // verifies secret and checks exp
    jwt.verify(token, app.get('superSecret'), function(err, decoded) {
      if (err) {
        return res.status(400).json({ success: false, message: 'Failed to authenticate token.' });
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;
        next();
      }
    });

  } else {

    // if there is no token
    // return an error
    return res.status(403).send({
        success: false,
        message: 'No token provided.'
    });

  }
});

router.route('/students')

    // create a student
    .post(function(req, res) {
        var student = new Student();      // create the new student with the request parameters
        student.name = req.body.name;
        student.password = req.body.password;
        student.admin = req.body.admin;

        // save the student and check for errors
        student.save(function(err) {
            if (err)
                res.status(500).send(err);
            res.status(201).json(student);
        });
    })

    // get all the students
    .get(function(req, res) {
        Student.find(function(err, students) {
            if (err)
                res.status(500).send(err);
            res.status(200).json(students);
        });
    });

    // get the student with id
    router.route('/students/:student_id')

    .get(function(req, res) {
        Student.findById(req.params.student_id, function(err, student) {
            if (err)
                res.status(500).send(err);
            res.status(200).json(student);
        });
    })

    // update student with id
    .put(function(req, res) {
        // use our student model to find the student we want
        Student.findById(req.params.student_id, function(err, student) {
            if (err)
                res.send(err);
            // update the student info
            student.name = req.body.name;
            student.password = req.body.password;
            student.admin = req.body.admin;
            // save the student
            student.save(function(err) {
                if (err)
                    res.status(500).send(err);
                res.status(200).json(student);
            });

        });
    })

    //delete student with id
    .delete(function(req, res) {
        Student.remove({
            _id: req.params.student_id
        }, function(err, student) {
            if (err)
                res.status(500).send(err);
            res.status(200).json('OK')
        });
    });

// all of our routes will be prefixed with /v1
app.use('/v1', router);

// START THE SERVER
app.listen(port);
console.log('Listening on port ' + port);
