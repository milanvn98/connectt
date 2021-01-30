
///////////////////////////////////////// Navigation///////////////////////////////////////////////

$('.nav-new-employee').click(function(){
    $('.nav-profile').removeClass('nav-item-active')
    $('.nav-new-employee').addClass('nav-item-active')
    $('.new-employee-container').removeClass('d-none')
    $('.profile-container').addClass('d-none')
})

$('.nav-profile').click(function(){
    $('.nav-profile').addClass('nav-item-active')
    $('.nav-new-employee').removeClass('nav-item-active')
    $('.new-employee-container').addClass('d-none')
    $('.profile-container').removeClass('d-none')
})

const url = window.location.href
const refStatus = url.split('=')[1]
if (refStatus == "true"){
    window.location.href = "https://localhost:3000/dashboard"
}

$('#new-request-btn').click( event => {
    $('.overlay').removeClass('d-none')
})

$('body').click(event => {
    if($(event.target).is('.overlay')){
        $('.overlay').addClass('d-none')
    }
})

if(document.querySelectorAll('.status').length > 24){
    for (i = 24; i > status.length; i++){
        document.querySelectorAll('.status')[i].setAttribute('disabled', true)
    }
}

