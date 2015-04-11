$(function(){
  var $glass = $('#hourglass'),
      $topSand = $glass.find('.top.sand'),
      $fallingSand = $glass.find('.falling.sand'),
      $bottomSand = $glass.find('.bottom.sand'),
      $start = $('#start'),
      $duration = $('#duration');

  var topSandBottom = +($topSand.css('bottom').match(/^[\d.]+/));
  var bottomSandTop = 65;
  var bottomSandBottom = 107;
  console.log(topSandBottom);

  function setPercentage(pct){
    $topSand.css('top', ((pct+0.1)*topSandBottom)+'px');
    $bottomSand.css('top', (bottomSandTop + (1-pct)*(bottomSandBottom-bottomSandTop))+'%');
  }

  window.setPercentage = setPercentage;

  $fallingSand.hide();

  var duration;

  function fill(){
    var now = +new Date();
    var n = (now - started) / duration;
    setPercentage(n);
    if(running && (n < 1)){
      setTimeout(fill, 100);
    }else{
      var notification = new Notification("Hourglass", {
          body: 'The hourglass has run out.'
      });
      stop();
    }
  }

  var started;
  var running;

  function start(){
    $start.removeClass('btn-success').addClass('btn-warning').text('Stop');
    started = +new Date();
    duration = (+$duration.val())*60e3;
    $duration.attr('disabled', true);
    $start.off('click').on('click', stop);
    running = true;
    $fallingSand.show();
    fill();
  }

  function stop(){
    $start.removeClass('btn-warning').addClass('btn-success').text('Start');
    $start.off('click').on('click', start);
    $duration.removeAttr('disabled');
    $fallingSand.hide();
    running = false;
  }

  stop();


  $('#enable').click(function(){
    Notification.requestPermission(function (permission) {
      // If the user is okay, let's create a notification
      if (permission === "granted") {
        $('#click-here-description').hide();
      }
    });
  });

  if(true || Notification.permission === 'granted') {
    $('#click-here-description').hide();
  }

});
