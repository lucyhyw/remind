var phoneNumber

// Set phone number
$('input#number-submit').click(function() {
  phoneNumber = $('input#number-text').val()
})

// enter button submit
$('form').submit(function() {
  event.preventDefault()
})
// Messaging
$('button#message-submit').click(function() {
  // phone number validation

  // add user bubble
  var msg = $('input#message-text').val()
  $('input#message-text').val('')
  $('#conversation').append('<div class="user bubble">' + msg + '</div>')
  $('#conversation').append('<div style="clear: both"></div>')
  $('#conversation').scrollTop($('#conversation').prop('scrollHeight'))

  // ajax call
  $.ajax({
    method: "POST",
    url: "http://localhost:3000/send",
    data : { number: phoneNumber,
             message: msg},
    dataType: 'json'
  })
    // add bot reply
    .done(function (response) {
      // set number
      if (phoneNumber == null && response.number != null) {
        phoneNumber = response.number
        $('#conversation').append('<div class="bot bubble">' + response.reply[0] + '</div>')
        $('#conversation').append('<div style="clear: both"></div>')
        setTimeout(function() {
          $('#conversation').append("<div class=\"bot bubble\">Great! Now you're free to create reminders. Try typing in 'remind me to dance in 5 seconds'</div>")
          $('#conversation').append('<div style="clear: both"></div>')
          $('#conversation').scrollTop($('#conversation').prop('scrollHeight'))
        }, 500)
      } else {
        if (response.number != null) {
          phoneNumber = response.number
        }
        $.each(response.reply, function(index, element) {
          setTimeout(function() {
            $('#conversation').append('<div class="bot bubble">' + element + '</div>')
            $('#conversation').append('<div style="clear: both"></div>')
            $('#conversation').scrollTop($('#conversation').prop('scrollHeight'))
          }, (index * 500))
        })
      }
    })
})
