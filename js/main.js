/* global $ */

console.log('javascript working');

$(document).ready(function () {
  console.log('DOM loaded');
  var TIMER_ID = '';
  var TIME_LEFT = 99;
  var GAME_OVER = false;
  var CUR_IMG_IND = 0;
  var SCORE = 0;
  var ASSIST_TIME_CREDITS = 3;
  var ASSIST_CLUE_CREDITS = 3;

  var img1 = {
    answerIndex: [10, 20, 30, 40, 50],
    cssClass: 'img1'
  };
  var img2 = {
    answerIndex: [10, 20, 30, 40, 50],
    cssClass: 'img2'
  };
  var img3 = {
    answerIndex: [10, 20, 30, 40, 50],
    cssClass: 'img3'
  };

  // Stores all previously the above img objects.
  var IMAGES = [img1, img2, img3];
  var IMAGES_PLAYED = []; // img objects popped here after each round.
  var CURRENT_IMG_OBJ = gameRound('check'); // stores answers for current round.

  // --- INITALISE GAME ---

  // CLICK LISTENERS
  // Generate click listeners for game 'pixels'.
  for (var i = 1; i <= 150; i++) {
    $('#pix-l-' + i).on('click', playTurn);
    $('#pix-r-' + i).on('click', playTurn);
  }
  // Click listeners for Help buttons
  $('#assist-clue').on('click', useClue);
  $('#assist-time').on('click', function () {
    if (ASSIST_TIME_CREDITS > 0) {
      timer('add');
      ASSIST_TIME_CREDITS--;
      $(this).text(ASSIST_TIME_CREDITS);
    } else if (ASSIST_TIME_CREDITS === 0) {
      displayMsg('Most curious, the time machine failed!');
    }
  });

  // Start timer
  timer('start');

  // !--- GAME LOGIC ---! //

  // ---- Main control-flow function ----
  // executes when any pixel is clicked.
  function playTurn (choice) {
    if (typeof choice === 'object') { // set up for click event handler
      var elementId = choice.target.id;
      var correctPixelSelected = isRight(elementId);
    } else if (typeof choice === 'string') { // set up for useClue function
      var elementId = choice;
      var correctPixelSelected = isRight(elementId);
    }

    if (correctPixelSelected) {
      $('#' + elementId).addClass('selected-circle');
      dittoClick(elementId); // execute ONLY if choice is right
      incrementScore();
      displayMsg('random');

      // check whether THIS round is over (5 differences found).
      if (isRoundOver()) {
        console.log('round is over');
        // check if this is the FINAL round
        if (isGameOver('check')) { // executes if IMAGES.length = 0
          console.log('final round finished');
          isGameOver('won'); // play victory video
        } else if (!isGameOver('check')) { // if this is not the final round
          console.log('not final round, serving new round');
          displayMsg('Splendid job. Now let\'s move on...');
          timer('stop'); // freeze progress bar
          displayMsg('countdown');
          // reset time, clear board, start new round
          setTimeout(function () {
            TIME_LEFT = 100;
            clearBoard();
            gameRound('new');
            timer('start');
            displayMsg('Don\'t let this simple puzzle beat you, Watson...');
          }, 5000);
        }
      }
    }
    if (!correctPixelSelected) {
      // play salah sound
      timer('penalty');
      $('#' + elementId).animateCss('wrong-cross fadeOut');
      $('#game-stage').animateCss('headShake');
    }

    function incrementScore () {
      var amt = TIME_LEFT * 50;
      SCORE += amt;
      $('#score-ui').text(SCORE);
    }

    // returns true if 5 differences have been found
    // returns false if less than 5
    function isRoundOver () {
      var count = 0;
      for (var j = 0; j < CURRENT_IMG_OBJ.answerIndex.length; j++) {
        if (CURRENT_IMG_OBJ.answerIndex[j] === 'found') {
          count++;
        }
      }
      if (count === 5) {
        return true;
      }
      return false;
    }

    function whoWon () {}

    function isRight (pixel) {
      // pixel format: pix-r-10
      var curAnsIndex = CURRENT_IMG_OBJ.answerIndex;
      console.log('pixel id selected: ' + pixel);
      // Prevents previously correctly selected pixel from returning true.
      // if pixel has 'selected-circle' class, return nonsense string to playTurn().
      // Array.from() used to convert classList iterable obj to proper array.
      var clArray = Array.from(document.getElementById(pixel).classList);
      if (clArray.indexOf('selected-circle') !== -1) {
        return 'already selected';
      } else {  // Verify pixel selected against answer index.
        for (var i = 0; i < curAnsIndex.length; i++) {
          if (pixel.endsWith(curAnsIndex[i])) {
            curAnsIndex[i] = 'found';
            console.log('correct pixel selected');
            console.log('new answer index: ' + curAnsIndex);
            return true;
          }
        }
        console.log('wrong pixel selected');
        return false;
      }
    }

    // Duplicates clicks on one panel on the other.
    function dittoClick (elementId) {
      var leftOrRight = elementId.charAt(4);
      var toClick = '';
      if (leftOrRight === 'r') {
        toClick = elementId.replace('r', 'l');
      } else {
        toClick = elementId.replace('l', 'r');
      }
      $('#' + toClick).addClass('selected-circle');
    }
  }

  // 2 options to manipulate images -
  // (1) 'new': retires old image and serves new one on DOM.
  // (2) 'check': returns current in-play image object.
  function gameRound (option) {
    if (option === 'new') {
      // DEALING WITH THE OLD - Update javascript variables:
      var oldImgObj = IMAGES[CUR_IMG_IND];
      IMAGES_PLAYED.push(oldImgObj); // add old img to played array.
      IMAGES.splice(CUR_IMG_IND, 1); // remove old img from unserved array.
      // BRING ON THE NEW
      // randomly select new image to serve
      CUR_IMG_IND = randomIntFromInterval(0, IMAGES.length - 1);
      // update CURRENT_IMG_OBJ
      var newImgObj = IMAGES[CUR_IMG_IND];
      CURRENT_IMG_OBJ = newImgObj;
      console.log('new image object: ', newImgObj);
      serveNewImg(newImgObj); // removes old image, adds new one
    }
    if (option === 'check') {
      // returns current image object
      return IMAGES[CUR_IMG_IND];
    }
  }

  // Updates DOM with new image for a new round.
  // Called by gameRound function.
  function serveNewImg (imgObject) {
    // 'img' argument is an object corresponding to current img in play.
    console.log('img object in serveNewImg: ', imgObject);
    var leftPaneClassList = document.getElementById('left-pane').classList;
    var rightPaneClassList = document.getElementById('right-pane').classList;
    var leftOldImgClass = '';
    var rightOldImgClass = '';
    // finds out name of current image class on screen
    leftPaneClassList.forEach(function (element, index, array) {
      if (element.includes('img')) {
        leftOldImgClass = element;
      }
    });
    rightPaneClassList.forEach(function (element, index, array) {
      if (element.includes('img')) {
        rightOldImgClass = element;
      }
    });
    // remove old image CSS class
    $('#left-pane').removeClass(leftOldImgClass);
    $('#right-pane').removeClass(rightOldImgClass);
    // add new image CSS class
    // based on img object's 'name' key
    $('#left-pane').addClass(imgObject.cssClass + 'a');
    $('#right-pane').addClass(imgObject.cssClass + 'b');
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
        if (TIME_LEFT < 0) {
          clearInterval(TIMER_ID);
          isGameOver();
        } else if (TIME_LEFT < 15) {
          $('#time-bar').removeClass('progress-bar-warning progress-bar-success');
          $('#time-bar').addClass('progress-bar-danger');
          // $('#time-bar').animateCss('jello');
        } else if (TIME_LEFT < 50) {
          $('#time-bar').removeClass('progress-bar-warning progress-bar-success');
          $('#time-bar').addClass('progress-bar-warning');
        } else if (TIME_LEFT === 99) {
          $('#time-bar').removeClass('progress-bar-warning progress-bar-success progress-bar-danger');
          $('#time-bar').addClass('progress-bar-success');
        }
      }, 1000);
    } else if (option === 'stop') {
      clearInterval(TIMER_ID);
    } else if (option === 'add') {  // used when user activates assist-time
      TIME_LEFT += 10;
    } else if (option === 'penalty') { // when user selects wrong pixel
      TIME_LEFT -= 6;
    }
  }

  function useClue () {
    // reduce clue credits
    if (ASSIST_CLUE_CREDITS > 0) {
      ASSIST_CLUE_CREDITS--;
      $('#assist-clue').text(ASSIST_CLUE_CREDITS.toString());
      // -- Auto select mechanism --
      var answers = CURRENT_IMG_OBJ.answerIndex;
      var answerIdNum = 'found'; // number that is a correct answer
      var index = 0; // used as counter in while loop.
      // loop through answers until it finds one that is yet to be selected by user.
      while (answerIdNum === 'found') {
        answerIdNum = answers[index];
        console.log('answerIdNum computer selected: ', answerIdNum);
        index++;
      }
      // format pixId into something usable by playTurn(choice).
      var pixId = 'pix-r-' + answerIdNum;
      // use playTurn to execute the click
      playTurn(pixId);
    }
  }

  function displayMsg (msg) {
    var randMsg = [
      'Good call.',
      'Very astute, Watson.',
      'Surely you\'re rubbing off me!'
    ];
    if (msg === 'random') {
      // select from an array of possible messages.
      var cheer = randMsg[randomIntFromInterval(0, randMsg.length - 1)];
      $('#msg-box').text(cheer);
    } else if (msg === 'countdown') {
      console.log('initiating countdown');
      var count = 5;

      var tempTimer = setInterval(function () {
        console.log('inside new interval timer');
        $('#countdown-timer').text(count.toString()); // display in middle of screen
        count--;
        if (count < 0) {
          clearInterval(tempTimer);
          $('#countdown-timer').text('');
        }
      }, 1000);
    } else {
      $('#msg-box').text(msg);
    }
  }

  function clearBoard () {
    $('.pixel').removeClass('selected-circle');
  }

  // function isGameOver () {
  //   if (TIME_LEFT < 0) {
  //     displayMsg('It\'s over Watson, it\'s over...');
  //     GAME_OVER = true;
  //     return true;
  //
  //   }
  // }

  // 3 OPTIONS PARAMETERS
  // (1) 'CHECK' - RETURNS TRUE IF FINAL ROUND IS OVER
  // (2) 'LOST' - SETS GAME_OVER TO TRUE, UPDATE displayMsg
  // (3) 'WON' - SETS GAME_OVER TO TRUE, CALL victoryVideo
  function isGameOver (option) {
    if (option === 'check') { // returns true if final round is over
      if (IMAGES.length - 1 === 0) { // no more images to play
        var count = 0;
        CURRENT_IMG_OBJ.answerIndex.forEach(function (el, ind, arr) {
          if (el === 'found') {
            count++;
          }
        });
        // no more images AND all
        if (count === CURRENT_IMG_OBJ.answerIndex.length) {
          console.log('final round gameover detected');
          return true;
        }
      } else {
        return false;
      }
    } else if (option === 'lost') {
      displayMsg('It\'s over Watson, it\'s over...');
      GAME_OVER = true;
    } else if (option === 'won') {
      // pop up window w/ 2 options: (1) restart (2) cancel
      GAME_OVER = true;
      victoryVideo();
    }
  }

  // function restart () {}

  // -- OTHER NON-LOGIC FUNCTIONS ---

  // Integrates with Bootstrap modal pop up to show Youtube video.
  function victoryVideo () {
    $('#videoPopUp').modal('show');
    var vidUrl = 'https://www.youtube.com/embed/M8_mCdHFCc4?autoplay=1';
    $('#videoPopUp').find('iframe').attr('src', vidUrl);
    $('.modal').each(function () {
      $(this).on('click', function () {
        $(this).find('iframe').attr('src', '');
      });
    });
  }

  // animate.css jQuery extension function
  $.fn.extend({
    animateCss: function (animationName) {
      var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
      $(this).addClass('animated ' + animationName).one(animationEnd, function () {
        $(this).removeClass('animated ' + animationName);
      });
    }
  });

  function randomIntFromInterval (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
});
