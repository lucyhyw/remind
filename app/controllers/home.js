var express = require('express'),
  router = express.Router(),
  url = 'mongodb://localhost:27017/remind',
  {Wit, log} = require('node-wit'),
  Agenda = require('agenda'),
  assert = require('assert'),
  agenda = new Agenda({db: {address: url}}),
  Agendash = require('agendash')
  rp = require('request-promise'),
  mc = require('mongodb').MongoClient,
  moment = require('moment');

require('./config/agenda.js')(agenda)

module.exports = function (app) {
  app.use('/', router);
  app.use('/send', router);
  app.use('/agendash', Agendash(agenda));
};

router.get('/', function (request, response, next) {
  response.render('home')
});

router.post('/send', function(request, response, next) {
	const client = new Wit({accessToken: 'HCVU3L6J5QWHDRVTABQGC7W65TF7LPU2'})
	client.message(request.body.message, {})
		.then((data) => {
			var entities = data.entities
			console.log("connected to wit server")

			// change notification number
			if (entities.intent == null &&
					entities.reminder == null &&
					entities.datetime == null &&
					entities.phone_number != null) {

				// send reply
				response.json({
					number: entities.phone_number[0].value,
					reply: ["I have set your phone number to " +
						entities.phone_number[0].value + "."]
				})
			} else if (entities.intent != null &&
								 entities.intent[0].value.toLowerCase() == "remind me" &&
								 entities.reminder != null &&
								 entities.datetime != null &&
								 request.body.number != null) {
				var reminder = entities.reminder[0].value,
						datetime = entities.datetime[0].value
				console.log("creating reminder")
				mc.connect(url, function(err, db) {
					assert.equal(null, err)
					console.log("connected to db")

					agenda.schedule(new Date(datetime), 'remind',
						{ message: "Remember to " + reminder + "!",
							number: request.body.number});
					agenda.start()
					db.close()
				})
				response.json({
					reply: ["I will remind you to '" + reminder + "' " + moment(datetime).calendar().toLowerCase() + "."]
				})
			} else if (entities.intent != null &&
								 entities.intent[0].value == "remind me" &&
								 request.body.number == null) {
				response.json({
					reply: ["Your reminder has not been set.", "Please type in a phone number I should remind you at and set your reminder again."]
				})
			}
		})
		.catch(console.error)
});