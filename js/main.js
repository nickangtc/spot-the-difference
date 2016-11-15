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

  // Stores all answer objects (see answers.js)
  var IMAGES = [img1, img2, img3];
  var IMAGES_PLAYED = []; // img objects popped here after each round.
  var CUR_IMG_IN_PLAY = gameRound('check'); // stores answers for current round.

  // --- INITALISE GAME ---

  // CLICK LISTENERS
  // Click listeners for left and right image canvas
  document.getElementById('canvas-left').addEventListener('click', playTurn, false);
  document.getElementById('canvas-right').addEventListener('click', playTurn, false);

  // Click listeners for Assist buttons
  $('#assist-clue').on('click', useClue);
  $('#assist-time').on('click', function () {
    if (ASSIST_TIME_CREDITS > 0) {
      document.getElementById('time-fx').play();
      timer('add');
      ASSIST_TIME_CREDITS--;
      $('#assist-time').children('span').text(ASSIST_TIME_CREDITS.toString());
    } else if (ASSIST_TIME_CREDITS === 0) {
      displayMsg('Most curious, the time machine failed!');
    }
  });

  // Start timer
  timer('start');

  // !--- GAME LOGIC ---! //
  // ---- playTurn is the main control-flow function ----
  // Executes when any part of image canvas is clicked.
  function playTurn (ev) {
    var isCorrect = false;
    var foundArr = [];
    var latestFind = [];  // 1d array

    // executes when user clicks Clue Assist
    if (Array.isArray(ev)) {
      latestFind = ev;
      isCorrect = true; // ansArr will always be true
      // executes when user clicks on image to try to spot difference
    } else if (typeof ev === 'object' && !Array.isArray(ev)) {
      var position = getPosition(ev); // returns [x-val, y-val]
      isCorrect = isRight(position);
      var elementId = ev.target.id;
      foundArr = CUR_IMG_IN_PLAY['found'];
      latestFind = foundArr[foundArr.length - 1];  // 1d array
    }
    // executes when correct answer is detected.
    if (isCorrect && !GAME_OVER) {
      // searches 2d array for the latest 1d array in it
      // foundArr: [lowerX, upperX, lowerY, upperY, centerX, centerY]
      var lowerX = latestFind[0];
      var upperX = latestFind[1];
      var lowerY = latestFind[2];
      var upperY = latestFind[3];
      var centerX = latestFind[4];
      var centerY = latestFind[5];
      var width = upperX - lowerX;
      var height = upperY - lowerY;

      drawEllipse('canvas-left', centerX, centerY, width, height);
      drawEllipse('canvas-right', centerX, centerY, width, height);
      incrementScore();
      displayMsg('random');
      document.getElementById('right-fx').play();
      if (isRoundOver()) {
        // check if this is the FINAL round
        if (isGameOver('final')) {
          isGameOver('won'); // play victory video
        } else if (!isGameOver('final')) {
          // if this is NOT the final round
          displayMsg('Splendid job. Now let\'s move on...');
          timer('stop'); // freeze progress bar
          displayMsg('countdown');
          // reset time, clear board, start new round
          setTimeout(function () {
            TIME_LEFT += 15;
            clearCanvas();
            gameRound('new');
            timer('start');
            displayMsg('One more coming your way...');
          }, 5000);
        }
      }
    }
    // executes when wrong choice is detected.
    if (!isCorrect && !GAME_OVER) {
      timer('penalty');
      // Draw cross using canvas
      drawAndFadeCross(elementId, position[0], position[1]);
      document.getElementById('wrong-fx').play();
      $('#game-stage').animateCss('headShake');
    }
  }

  function incrementScore () {
    var amt = TIME_LEFT * 50;
    SCORE += amt;
    $('#score-ui').text(SCORE);
  }

  // Pushes info of newly discovered answer into 'found' key in img object
  // info:
  // called by isRight() function
  function logFound (obj, areaArr) {
    // areaArr format: [lowerX, upperX, lowerY, upperY, centerX, centerY]
    var target = obj;
    target['found'].push(areaArr); // store array in obj key 'found'
  }

  // checks whether a click is in an undiscovered area.
  function isUndiscovered (obj, clickX, clickY) {
    var arr = obj['found']; // stores 2d array
    for (var i = 0; i < arr.length; i++) {
      if (clickX >= arr[i][0] && clickX <= arr[i][1] && clickY >= arr[i][2] && clickY <= arr[i][3]) {
        return false; // the click is not undiscovered
      }
    }
    return true; // the click is undiscovered
  }

  // Verifies if a click is within any hot zone.
  function isRight (coords) {
    var clickX = coords[0]; // x-axis value
    var clickY = coords[1]; // y-axis value
    var coordsAnswerArr = CUR_IMG_IN_PLAY.ansCoords; // [[x, y], [x, y]...]
    var areaAnswerArr = CUR_IMG_IN_PLAY.ansArea; // [[x-width, y-height]...]

    // tests for already-rightly-clicked
    if (!isUndiscovered(CUR_IMG_IN_PLAY, clickX, clickY)) {
      return 'already discovered'; // make playTurn() do nothing when returned
    } else if (isUndiscovered(CUR_IMG_IN_PLAY, clickX, clickY)) {
      // check user's click against answers
      for (var i = 0; i < coordsAnswerArr.length; i++) {
        if (typeof coordsAnswerArr[i] !== 'string') {
          var x1 = coordsAnswerArr[i][0] - areaAnswerArr[i][0]; // x lower limit
          var x2 = coordsAnswerArr[i][0] + areaAnswerArr[i][0]; // x upper limit
          var y1 = coordsAnswerArr[i][1] - areaAnswerArr[i][1]; // y lower limit
          var y2 = coordsAnswerArr[i][1] + areaAnswerArr[i][1]; // y upper limit

          // if within hot zone
          if (clickX >= x1 && clickX <= x2 && clickY >= y1 && clickY <= y2) {
            var centerX = coordsAnswerArr[i][0];
            var centerY = coordsAnswerArr[i][1];
            CUR_IMG_IN_PLAY.ansCoords[i] = 'found'; // leave mark in answer array
            // push info to 'found' key of image object
            logFound(CUR_IMG_IN_PLAY, [x1, x2, y1, y2, centerX, centerY]);
            return true;
          }
        }
      }
      return false;
    }
  }

  // Checks whether current image's differences are all found.
  // true if 5 differences have been found
  function isRoundOver () {
    var count = 0;
    for (var j = 0; j < CUR_IMG_IN_PLAY.ansCoords.length; j++) {
      if (CUR_IMG_IN_PLAY.ansCoords[j] === 'found') {
        count++;
      }
    }
    if (count === 5) {
      return true;
    }
    return false;
  }

  // Check if game is over, or set lost/won state.
  // (1) 'CHECK' - RETURNS TRUE IF FINAL ROUND IS OVER
  // (2) 'LOST' - SETS GAME_OVER TO TRUE, UPDATE displayMsg
  // (3) 'WON' - SETS GAME_OVER TO TRUE, CALL victoryVideo
  function isGameOver (option) {
    if (option === 'final') { // returns true if final round is over
      if (IMAGES.length - 1 === 0) { // no more images to play
        var count = 0;
        CUR_IMG_IN_PLAY.ansCoords.forEach(function (el, ind, arr) {
          if (el === 'found') {
            count++;
          }
        });
        if (count === CUR_IMG_IN_PLAY.ansCoords.length) {
          return true;
        }
      } else {
        return false;
      }
    } else if (option === 'lost') {
      displayMsg('Game over. :( Refresh to try again!');
      GAME_OVER = true;
    } else if (option === 'won') {
      // pop up window w/ 2 options: (1) restart (2) cancel
      GAME_OVER = true;
      clearInterval(TIMER_ID);
      victoryVideo();
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
      // update CUR_IMG_IN_PLAY
      var newImgObj = IMAGES[CUR_IMG_IND];
      CUR_IMG_IN_PLAY = newImgObj;
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
  // 'add' for time extension when user clicks Time Assist
  function timer (option) {
    if (option === 'start') {
      TIMER_ID = setInterval(function () {
        var percentage = TIME_LEFT + '%';
        $('#time-bar').css('width', percentage);
        TIME_LEFT--;
        if (TIME_LEFT < 0) { // TIME'S UP - GAME OVER!
          clearInterval(TIMER_ID);
          GAME_OVER = true;
          document.getElementById('ticking').pause();
          document.getElementById('gameover').play();
        } else if (TIME_LEFT < 20) {
          $('#time-bar').removeClass('progress-bar-warning progress-bar-success');
          $('#time-bar').addClass('progress-bar-danger');
          document.getElementById('ticking').play();
        } else if (TIME_LEFT === 50) {
          $('#time-bar').removeClass('progress-bar-warning progress-bar-success');
          $('#time-bar').addClass('progress-bar-warning');
        } else if (TIME_LEFT === 99) {
          $('#time-bar').removeClass('progress-bar-warning progress-bar-success progress-bar-danger');
          $('#time-bar').addClass('progress-bar-success');
        }
      }, 700);
    } else if (option === 'stop') {
      clearInterval(TIMER_ID);
    } else if (option === 'add') {  // used when user activates assist-time
      TIME_LEFT += 10;
    } else if (option === 'penalty') { // when user selects wrong pixel
      TIME_LEFT -= 6;
    }
  }

  // Executes when user clicks Clue Assist.
  function useClue () {
    // reduce clue credits
    if (ASSIST_CLUE_CREDITS > 0) {
      ASSIST_CLUE_CREDITS--;
      $('#assist-clue').children('span').text(ASSIST_CLUE_CREDITS.toString());
      document.getElementById('clue-fx').play();

      // -- Auto select mechanism --
      // coordsArray[i] is associated directly with areaArray[i]
      var coordsArray = CUR_IMG_IN_PLAY.ansCoords; // 2d array
      var areaArray = CUR_IMG_IN_PLAY.ansArea; // 2d array
      var choiceCoords = []; // 1d array with coords to right answer
      var choiceArea = []; // 1d array with area dimensions to right answer
      var index = 0;
      // loop through answers until it finds one that is yet to be selected by user.
      for (var i = 0; i < coordsArray.length; i++) {
        if (coordsArray[i] !== 'found') {
          choiceCoords = coordsArray[i];
          choiceArea = areaArray[i];
          index = i;
        }
      }
      // format array into something usable by playTurn():
      // [lowerX, upperX, lowerY, upperY, centerX, centerY]
      var centerX = choiceCoords[0];
      var centerY = choiceCoords[1];
      var lowerX = centerX - choiceArea[0];
      var upperX = centerX + choiceArea[0];
      var lowerY = centerY - choiceArea[1];
      var upperY = centerY + choiceArea[1];

      var arr = [lowerX, upperX, lowerY, upperY, centerX, centerY];

      CUR_IMG_IN_PLAY['found'].push(arr); // store in found key of img object
      CUR_IMG_IN_PLAY.ansCoords[index] = 'found'; // leave 'found' marker in answer array

      // use playTurn to execute the click on image
      playTurn(arr);
    }
  }

  // Pushes message onto the msg display box.
  function displayMsg (msg) {
    var randMsg = [
      'Good call.',
      'Very astute, Watson.',
      'Have you considered becoming a detective?',
      'Ooh I didn\'t even see that!'
    ];
    if (msg === 'random') {
      // select from an array of possible messages.
      var cheer = randMsg[randomIntFromInterval(0, randMsg.length - 1)];
      $('#msg-box').text(cheer);
    } else if (msg === 'countdown') {
      var count = 5;

      var tempTimer = setInterval(function () {
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

  // CANVAS CONTROL FUNCTIONS

  // Gets offsetted coordinates of click on <canvas>
  // x,y origin is at top left corner of canvas element
  function getPosition (ev) {
    var paneId = ev.target.id;
    var leftOffset;
    var topOffset;
    if (paneId.includes('left')) {
      leftOffset = document.getElementById('left-pane').offsetLeft;
      topOffset = document.getElementById('left-pane').offsetTop;
    } else if (paneId.includes('right')) {
      leftOffset = document.getElementById('right-pane').offsetLeft;
      topOffset = document.getElementById('right-pane').offsetTop;
    }
    var x = ev.x; // x-position of click on viewport (not canvas)
    var y = ev.y; // y-position of click on viewport

    x -= leftOffset;
    y -= topOffset;

    // console.log('x: ', x, ' y: ', y);

    return [x, y];
  }

  // drawCircle('canvas-left', 70, 80, 30);

  // Draws oval shape on <canvas> elements
  // (modified from: http://bit.ly/2bBPWHm)
  function drawEllipse (id, centerX, centerY, width, height) {
    var canv = document.getElementById(id);
    var ctx = canv.getContext('2d');

    ctx.beginPath();
    ctx.moveTo(centerX, centerY - height / 2); // startpoint top

    ctx.bezierCurveTo( // half an oval
      centerX + width / 2, centerY - height / 2, // CP top right
      centerX + width / 2, centerY + height / 2, // CP bottom right
      centerX, centerY + height / 2); // endpoint bottom

    ctx.bezierCurveTo( // 2nd half
      centerX - width / 2, centerY + height / 2, // CP bottom left
      centerX - width / 2, centerY - height / 2, // CP top left
      centerX, centerY - height / 2); // startpoint top

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#A0BA68';
    ctx.stroke();
  }

  // // proof that the function works correctly...
  // drawEllipse('canvas-left', 34, 192, 40, 130);
  // drawEllipse('canvas-left', 264, 564, 300, 40);

  // Draws big fat 'X' on clicked coordinates
  // and clears it after a setTimeout
  function drawAndFadeCross (id, x, y) {
    var can = document.getElementById(id);
    var ctx = can.getContext('2d');

    ctx.moveTo(x - 20, y - 20);
    ctx.lineTo(x + 20, y + 20);
    ctx.stroke();

    ctx.moveTo(x - 20, y + 20);
    ctx.lineTo(x + 20, y - 20);
    ctx.stroke();

    // clear the cross 1 sec after it appears
    setTimeout(function () {
      ctx.clearRect(x - 20, y - 20, 45, 45);
    }, 1000);
  }

  // Clears both canvas completely
  function clearCanvas () {
    var canv = document.getElementById('canvas-left').getBoundingClientRect();
    var width = Math.round(canv.width);
    var height = Math.round(canv.height);
    var canvLeft = document.getElementById('canvas-left').getContext('2d');
    var canvRight = document.getElementById('canvas-right').getContext('2d');

    canvLeft.clearRect(0, 0, width, height);
    canvRight.clearRect(0, 0, width, height);
  }

  // -- OTHER NON-LOGIC FUNCTIONS ---

  // animate.css jQuery extension function
  $.fn.extend({
    animateCss: function (animationName) {
      var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
      $(this).addClass('animated ' + animationName).one(animationEnd, function () {
        $(this).removeClass('animated ' + animationName);
      });
    }
  });

  // Integrates with Bootstrap modal pop up to show Youtube video.
  function victoryVideo () {
    $('#videoPopUp').modal('show');
    var vidUrl = 'https://www.youtube.com/embed/JPBRbIvs5lc?autoplay=1';
    $('#videoPopUp').find('iframe').attr('src', vidUrl);
    $('.modal').each(function () {
      $(this).on('click', function () {
        $(this).find('iframe').attr('src', '');
      });
    });
  }

  // MATH
  function randomIntFromInterval (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
});
