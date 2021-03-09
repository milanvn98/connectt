///////////////////////////////////////// Navigation///////////////////////////////////////////////

$('.nav-new-employee').click(function () {
    $('.nav-profile').removeClass('nav-item-active')
    $('.nav-new-employee').addClass('nav-item-active')
    $('.new-employee-container').removeClass('d-none')
    $('.profile-container').addClass('d-none')
})

$('.nav-profile').click(function () {
    $('.nav-profile').addClass('nav-item-active')
    $('.nav-new-employee').removeClass('nav-item-active')
    $('.new-employee-container').addClass('d-none')
    $('.profile-container').removeClass('d-none')
})

const url = window.location.href
const refStatus = url.split('=')[1]
if (refStatus == "true") {
    window.location.href = "https://www.connecttbs.com/dashboard"
}

$('#new-request-btn').click(event => {
    const form = $('#new-employee-form')[0]
    form.action = "/new-employee-request"
    $('#form-title')[0].innerHTML = "New Employee Request"
    const inputs = form.querySelectorAll('input')

    $('.overlay').removeClass('d-none')
})

$('body').click(event => {
    if ($(event.target).is('.overlay')) {
        $('.overlay').addClass('d-none')
    }
})

if (document.querySelectorAll('.status').length > 24) {
    for (i = 24; i > status.length; i++) {
        document.querySelectorAll('.status')[i].setAttribute('disabled', true)
    }
}

$('.t-row').click(event => {
   
    if (event.target.tagName == "TD") {
        const request_id = event.target.parentElement.querySelector('#reqID').value

        $.ajax('/find-employee?request_id=' + request_id, {
            type: 'GET',
            success: function (data) {
                fillForm(data)
            }
        })

        const form = $('#new-employee-form')[0]
        form.action = "/edit-employee-request"
        $('#form-title')[0].innerHTML = "Edit Employee Request"
        $('.overlay').removeClass('d-none')
        
        console.log( $('.overlay'))
    }


})

function editRequest(target) {





}

function fillForm(data) {

    const form = $('#new-employee-form')[0]

    const dateTime = data['startDate'].split('T')[0]
    data['startDate'] = dateTime

    if (!data['status_code']) {
        const inputs = form.querySelectorAll('input')
        for (input of inputs) {
            for (key in data) {
                if (input.name == key) {
                    input.value = data[key]
                }
                if (key == 'employmentBasis') {
                    form.querySelector('#' + data['employmentBasis']).checked = true
                }
            }
        }
    } else {
        alert('Error 501: Could not find Request')
    }


}