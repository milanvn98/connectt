const modals = $('.popup');
const btns = $('.team-tag');


window.addEventListener("click", function(event) {
    for (let i = 0; i < btns.length; i++) {
    if (event.target == modals[i]) {
        modals[i].style.display = "none";
      } 
    if (event.target == btns[i]) {
        modals[i].style.display = "block";
      } 
    }
});
