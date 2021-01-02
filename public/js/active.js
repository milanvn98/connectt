const url = window.location.href;
let split = url.split("/");

const direction = split[split.length - 1];

switch (direction) {
  case "about":
    $(".about").addClass("active");
    break;
  case "contact":
    $(".contact").addClass("active");
    break;
  case "bookkeeping":
  case "profit":
  case "tax":
    $(".services").addClass("active");
    break;
  default:
    $(".home").addClass("active");
}
