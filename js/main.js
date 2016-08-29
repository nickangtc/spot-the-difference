/* global $ */

console.log('javascript working');

$(document).ready(function () {
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
    var element = choice.target;
    console.log('clicked on: ' + element.id);
    var correctPixelSelected = isRight(element.id);
    // Executes when correct pixel is selected by user.
    if (correctPixelSelected) {
      $('#' + element.id).addClass('selected-circle');
      dittoClick(element); // execute ONLY if choice is right
      incrementScore();
    }
    if (!correctPixelSelected) {
      // make 'X' img appear and fade out
      // play salah sound
      // maybe vibrate the page too
      timer('penalty');
    }
    setTimeout(function () { // TESTING
      doImg('new');
    }, 2000);

    // 2 options to manipulate images -
    // (1) 'new': retires old image and serves new one on DOM.
    // (2) 'check': returns current in-play image object.
    function doImg (option) {
      if (option === 'new') {
        // OLD MANAGEMENT - Update javascript variables:
        var oldImgObj = IMAGES[CUR_IMG_IND];
        console.log('old image object: ', oldImgObj);
        IMAGES_PLAYED.push(oldImgObj); // add old img to played array.
        IMAGES.splice(CUR_IMG_IND, 1); // remove old img from unserved array.
        // NEW MANAGEMENT
        var randNum = randomIntFromInterval(0, IMAGES.length - 1);
        CUR_IMG_IND = randNum; // randomly select new image to serve
        var newImgObj = IMAGES[CUR_IMG_IND];
        console.log('new image object: ', newImgObj);
        serveNewImg(newImgObj); // removes old image, adds new one
      }
      if (option === 'check') {
        // returns current image object
        return IMAGES[CUR_IMG_IND];
      }

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
    }

    function incrementScore () {
      var amt = TIME_LEFT * 50;
      SCORE += amt;
      $('#score-ui').text(SCORE);
    }

    function isGameOver () {}

    function whoWon () {}

    function isRight (pixel) {
      // pixel format: pix-r-10
      // img1.answerIndex;
      var currentImgObj = IMAGES[CUR_IMG_IND];
      var currentAnswersArr = currentImgObj.answerIndex;
      console.log('arg passed to isRight: ' + pixel);
      for (var i = 0; i < currentAnswersArr.length; i++) {
        if (pixel.endsWith(currentAnswersArr[i])) {
          currentAnswersArr[i] = 'found';
          console.log('correct pixel found!');
          console.log('new answer index: ' + currentAnswersArr);
          return true;
        }
      }
      console.log('wrong pixel selected');
      return false;
    }

    // Duplicates clicks on one panel on the other.
    function dittoClick (element) {
      var leftOrRight = element.id.charAt(4);
      var toClick = '';
      if (leftOrRight === 'r') {
        toClick = element.id.replace('r', 'l');
      } else {
        toClick = element.id.replace('l', 'r');
      }
      $('#' + toClick).addClass('selected-circle');
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
    } else if (option === 'add') {  // used when user activates assist-time
      TIME_LEFT += 10;
    } else if (option === 'penalty') { // when user selects wrong pixel
      TIME_LEFT -= 6;
    }
  }

  function useClue () {}

  function restart () {}

  function popUpMsg (msg) {}

  function displayMsg (msg) {
    $('#msg-box').text(msg);
  }

  function randomIntFromInterval (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
});
