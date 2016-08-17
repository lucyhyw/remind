var Agenda = require('agenda');

module.exports = function(agenda) {
	// define reminder
	agenda.define('remind', function(job, done) {
		var msg = job.attrs.data.message,
				locality = 'text';
				num = job.attrs.data.number
				console.log(num)
		rp({
			method: 'POST',
			uri: "http://textbelt.com/" + locality,
			body: {
				number: num,
				message: msg
			},
			json: true
		})
			.then(function (response) {
				console.log(response)
			})
			done()
	})
}