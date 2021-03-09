var currentTab = 0; // Current tab is set to be the first tab (0)
showTab(currentTab); // Display the current tab

function showTab(n) {
  // This function will display the specified tab of the form ...
  var tab = document.getElementsByClassName("tab");
  tab[n].style.display = "block";
  // ... and fix the Previous/Next buttons:
  if (n == 0) {
    document.getElementById("prevBtn").style.display = "none";
  } else {
    document.getElementById("prevBtn").style.display = "inline";
  }
  if (n == (tab.length - 1)) {
    document.getElementById("nextBtn").innerHTML = "Submit";
  } else {
    document.getElementById("nextBtn").innerHTML = "Next";
  }
  // ... and run a function that displays the correct step indicator:
  fixStepIndicator(n)
}

function nextPrev(n) {
  
  // This function will figure out which tab to display
  var tab = document.getElementsByClassName("tab");
  
  // Exit the function if any field in the current tab is invalid:
  if (n == 1 && !validateForm()) return false;
  // Hide the current tab:
  tab[currentTab].style.display = "none";
  // Increase or decrease the current tab by 1:
  currentTab = currentTab + n;
  // if you have reached the end of the form... :
  if (currentTab >= tab.length) {
    //...the form gets submitted:
    $('#form-btns').addClass('d-none');

    $('#thanks').append("<p class='text-white mt-5 mt-lg-0 text-center h2 fw-light my-3'>Thank you.</p>")
    setTimeout(function(){document.getElementById("new-employee-form").submit();},1000)
    
    return false;
  }
  // Otherwise, display the correct tab:
  showTab(currentTab);
}

function validateForm() {
  // This function deals with validation of the form fields
  var tabs, inputs, i, valid = true;
  tabs = document.getElementsByClassName("tab");
  inputs = tabs[currentTab].getElementsByTagName("input");
  // A loop that checks every input field in the current tab:
  for (i = 0; i < inputs.length; i++) {
    // If a field is empty...
    if (inputs[i].value == "") {
      
      if (inputs[i].name != "tfn" && inputs[i].name != "mySuper" && inputs[i].name != "street2" && inputs[i].name != "secondAccountName" && inputs[i].name != "secondbsb" && inputs[i].name != "secondAccountNumber" && inputs[i].name != "fixedAmount" && inputs[i].name != "employeeNumber"){
        
        // add an "invalid" class to the field:
      inputs[i].className += " invalid";
      // and set the current valid status to false:
      valid = false;
    }}

    if (inputs[i].name == "tfn"){
      if(inputs[i].value != "" && !validateTFN()){
        valid = false;
      }
    }

    if (inputs[i].name == "postcode"){
      if (inputs[i].value.length != 4){
        valid = false
        inputs[i].classList.add('invalid')
      }
    }

    if (inputs[i].name == "bsb"){
      if (inputs[i].value.length != 6){
        valid = false
        inputs[i].classList.add('invalid')
      }
    }

    if (inputs[i].name == "classification"){
      if (inputs[i].value.length != 8){
        valid = false
        inputs[i].classList.add('invalid')
      }
    }

    if (inputs[i].name == "consent"){
      if (!inputs[i].checked){
        valid = false
        inputs[i].classList.add('invalid')
      }
    }
  }
  // If the valid status is true, mark the step as finished and valid:
  if (valid) {
    document.getElementsByClassName("step")[currentTab].className += " finish";
  }
  return valid; // return the valid status
}

function fixStepIndicator(n) {
  // This function removes the "active" class of all steps...
  var i, step = document.getElementsByClassName("step");
  for (i = 0; i < step.length; i++) {
    step[i].className = step[i].className.replace(" active", "");
  }
  //... and adds the "active" class to the current step:
  step[n].className += " active";
}


//Validate TFN
$('#tfn').change( event => {
    if (!validateTFN(event)){
      $('#tfn').addClass('invalid')
    } else {
      $('#tfn').removeClass('invalid')
    }
})

function validateTFN(){
  weights = [1, 4, 3, 7, 5, 8, 6, 9, 10]  
  const tfn = $('#tfn')[0].value.split('')
  if(tfn.length == 9){
    let total = 0;

    weights.forEach( weight => {
      total += weight * tfn[weights.indexOf(weight)]
    });
     if (total % 11 == 0){
      return true
     } else {
       return false
     }
  } else {
    return false
  }
}

//Disable TFN
$('#noTfn').change( event => {
    if(event.target.checked){
      $('#tfn')[0].value == ""
      $('#tfn').attr('disabled', true)
    } else {
      $('#tfn')[0].value == ""
      $('#tfn').attr('disabled', false)
    }
  
})


$('#new-bank-account-btn').click( event => {
  $('#secondBank').removeClass('d-none')
})

$('#superFund').change( event => {
  const input = event.target
  if(input.value == "own"){
    $('#superDiv').removeClass('d-none')
  }
})