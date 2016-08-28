console.log('javascript working');

$(document).ready(function () {

  var TIMER_ID = "";
  var TIME_LEFT = 99;
  var GAME_OVER = false;

  var IMAGES = [img1, img2];
  var img1 = {
    answerIndex: [10, 20, 30, 40, 50]
  };
  var img2 = {
    answerIndex: [10, 20, 30, 40, 50]
  };

  // --- INITALISE GAME ---

  // Generate click listeners for game 'pixels'.
  for (var i = 1; i <= 150; i++) {
    $('#pix-l-' + i).on('click', playTurn);
    $('#pix-r-' + i).on('click', playTurn);
  }

  // Start timer
  timer('start');

  // !--- GAME LOGIC ---! //

  // ---- Main control-flow function ----
  // executes when any pixel is clicked.
  function playTurn (choice) {
    var element = choice.target;
    $('#' + element.id).addClass('selected-circle');
    console.log("clicked on: " + element.id);

    dittoClick(element);  // execute ONLY if choice is right

    function currentChallenge () {}

    function isGameOver () {}

    function whoWon () {}

    function isRight (pixel) {}

    // Duplicates clicks on one panel on the other.
    function dittoClick (element) {
      var leftOrRight = element.id.charAt(4);
      var toClick = "";
      if (leftOrRight === 'r') {
        toClick = element.id.replace('r', 'l');
      } else {
        toClick = element.id.replace('l', 'r');
      }
      $("#" + toClick).addClass("selected-circle");
    }

  }

  // 'start' / 'stop' timer
  // 'add time for time extension
  function timer (option) {
    if (option === 'start') {
      TIMER_ID = setInterval(function () {
        var percentage = TIME_LEFT + '%';
        $('#time-bar').css('width', percentage);
        $('#time-digits').text(TIME_LEFT);
        TIME_LEFT--;
        if (TIME_LEFT === 20) {
          $('#time-bar').toggleClass('progress-bar-warning');
          $('#time-bar').toggleClass('progress-bar-danger');
        }
        if (TIME_LEFT < 0) {
          clearInterval(TIMER_ID);
        }
      }, 1000);
    } else if (option === 'stop') {
      clearInterval(TIMER_ID);
    } else if (option === 'add') {  // used when user activates help-time
      TIME_LEFT += 10;
    }
  }

  function restart () {}

  function popUpMsg (msg) {}

  function displayMsg (msg) {}

});
