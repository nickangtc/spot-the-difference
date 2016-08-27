console.log('javascript working');

$(document).ready(function () {

  var TIMER_ID = "";
  var TIME_LEFT = 99;
  var GAME_OVER = false;

  var IMAGES = [img1, img2];
  var img1 = {
    // cssImgLeft: "img1a",
    // cssImgRight: "img1b",
    answerIndex: [10, 20, 30, 40, 50]
  };
  var img2 = {
    answerIndex: [10, 20, 30, 40, 50]
  };

  for (var i = 1; i <= 150; i++) {
    $('#pix-l-' + i).on('click', playTurn);
    $('#pix-r-' + i).on('click', playTurn);
  }

  // ---- Main control-flow function ----
  // executes when any pixel is clicked.
  function playTurn (choice) {
    var element = choice.target;
    console.log(element.id + ' was clicked!');
    $("#" + element.id).addClass("selected-circle");

    function currentQuestion () {}

    function isGameOver () {}

    function whoWon () {}

    function isRight (pixel) {}

  };

  // 'start' / 'stop' timer
  // 'add time for time extension
  function timer (option) {

  }

  function restart () {}

  function popUpMsg (msg) {}

  function displayMsg (msg) {}

});
