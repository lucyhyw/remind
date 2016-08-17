const exp = require('express')
const hb = require('express-handlebars')
const path = require('path')
const bp = require('body-parser')
const {Wit, log} = require('node-wit')
const rp = require('request-promise')

const assert = require('assert')
const Agenda = require('agenda')
const Agendash = require('agendash')
const moment = require('moment')

const app = exp()
const port = 3000

app.engine('.hbs', hb({
  defaultLayout: 'main',
  extname: '.hbs',
  layoutsDir: path.join(__dirname, '../views/layouts')
}))
app.set('view engine', '.hbs')
app.set('views', path.join(__dirname, '../views'))

// DATABASE

const mc = require('mongodb').MongoClient
const url = 'mongodb://localhost:27017/remind'
const agenda = new Agenda({db: {address: url}})
app.use('/agendash', Agendash(agenda));


/* ROUTING */

app.use(exp.static(path.join(__dirname, "../public")))

app.get('/', (request, response) => {
  response.render('home')
})

app.use(bp.json())
app.use(bp.urlencoded({extended: true}))

app.post('/send', function(request, response) {
  console.log(request.body.message)

  const client = new Wit({
    accessToken: 'HCVU3L6J5QWHDRVTABQGC7W65TF7LPU2'})

// TODO: error checking with Wit and db connections

  client.message(request.body.message, {})
    .then((data) => {
      var iobj = data.entities.intent
      var robj = data.entities.reminder
      var dobj = data.entities.datetime
      var nobj = data.entities.phone_number
      // console.log(data.entities)

      // set number
      if (iobj == null &&
          robj == null &&
          dobj == null &&
          nobj != null) {

            // send reply
            response.json({
              number: JSON.parse(JSON.stringify(nobj[0].value)),
              reply: ["I have set your phone number to " +
                JSON.parse(JSON.stringify(nobj[0].value)) + "."]
            })
          }
      // remind intent and complete info
      else if (iobj != null &&
        JSON.parse(JSON.stringify(iobj[0].value)) == "remind me" &&
        robj != null &&
        dobj != null &&
        request.body.number != null) {
          // clean up JSON
          var reminder = JSON.parse(JSON.stringify(robj[0].value))
          var datetime = JSON.parse(JSON.stringify(dobj[0].value))
          // console.log(reminder)
          // console.log(datetime)

          mc.connect(url, function(err, db) {
            assert.equal(null, err);
            console.log("Connected correctly to server.");

            // define reminder
            agenda.define('remind', function(job, done) {
              var msg = job.attrs.data.message
              console.log(msg)
              console.log("sending to " + job.attrs.data.num)
              rp({
                method: 'POST',
                uri: 'http://textbelt.com/canada',
                body: {
                  number: job.attrs.data.num,
                  message: msg
                },
                json: true
              })
                .then(function (parsedBody) {
                  console.log(parsedBody)
                  console.log("successfully sent to textbelt api")
                })
              done()
            })

            // create reminder
            // agenda.on('ready', function() {
              console.log(new Date(datetime))
              agenda.schedule(new Date(datetime), 'remind',
                { message: "Remember to " + reminder + "!",
                  num: request.body.number });
              agenda.start()
            // })
            db.close()
          });

          // send reply
          response.json({
            reply: ["I will remind you to '" + reminder + "' " + moment(datetime).calendar().toLowerCase() + "."]
          })
      }

      // remind user to set number
      if (iobj != null &&
      JSON.parse(JSON.stringify(iobj[0].value)) == "remind me" &&
      nobj == null &&
      request.body.number == null) {
        response.json({
          reply: ["Your reminder has not been set.", "Please type in a phone number I should remind you at and set your reminder again."]
        })
      }
    })
    .catch(console.error)
})

app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})
