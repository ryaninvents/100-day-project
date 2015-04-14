$(function(){
  var colors = {
    black: '#000',
    brown: '#741',
    red: '#F00',
    orange: '#F90',
    yellow: '#FF0',
    green: '#0A0',
    blue: '#23F',
    violet: '#70B',
    grey: '#888',
    white: '#fff',
    gold: '#c92',
    silver: '#aaa'
  };

  var colorDigits = {
    0: 'black',
    1: 'brown',
    2: 'red',
    3: 'orange',
    4: 'yellow',
    5: 'green',
    6: 'blue',
    7: 'violet',
    8: 'grey',
    9: 'white',
    gold: 'gold',
    silver: 'silver'
  };
  function numDigits(n){
    return Math.floor(Math.log(n) / Math.log(10));
  }

  function getColorsForValue(value){
    var n = numDigits(value);
    var firstDigit = Math.floor(value / Math.pow(10, n));
    var secondDigit = Math.floor(value / Math.pow(10, n-1)) % 10;
    return [[colorDigits[firstDigit]], [colorDigits[secondDigit]], getMultiplierColor(value)];
  }

  function getMultiplierColorByIndex(n){
    if(0 <= n && n <= 7) {
      return colors[colorDigits[n]];
    }
    if(n === 10) {
      return colors.gold;
    }
    if(n === 11) {
      return colors.silver;
    }
  }

  function getMultiplierIndex(value){
    var n = numDigits(value);
    if(0 <= n && n <= 7) {
      return n;
    }
    if(n === -1) {
      return 10;
    }
    if(n === -2) {
      return 11;
    }
  }

  function getMultiplierByIndex(n){
    if(0 <= n && n <= 7) {
      return Math.pow(10, n);
    }
    if(n === 10) {
      return 0.1;
    }
    if(n === 11){
      return 0.01;
    }
  }

  function getMultiplierSuffixByIndex(n) {
    if(0 <= n && n <= 7) {
      return getMultiplierTextByIndex(n).replace(/^1/,'');
    }
    if(n === 10) {
      return 'E-1';
    }
    if(n === 11){
      return 'E-2';
    }
  }

  function getMultiplierTextByIndex(n) {
    var d = n;
    var suffix;
    if(d < 3){
      suffix = '';
    } else if(d < 6) {
      suffix = 'K';
    } else if (d < 9) {
      suffix = 'M';
    }
    if(0 <= n && n <= 7) {
      return Math.pow(10, n%3)+suffix;
    }
    if(n === 10) {
      return "0.1";
    }
    if(n === 11){
      return "0.01";
    }
  }

  function getMultiplierColor(value){
    return getMultiplierColorByIndex(getMultiplierIndex(value));
  }

  function displayResistor(value, tol){
    var $bands = $('.resistor .band');
    var colors = getColorsForValue(value);
    $bands.each(function(i){
      if(!colors[i]) return;
      $bands.eq(i).css('background-color',colors[i]);
    });
  }

  function isDigit(n){
    n = +n;
    return (0 <= n) && (n <= 9);
  }

  function selectCell(){
    var $cell = $(this);
    var selectFor = $cell.attr('data-select-for');
    var $bands = $('.resistor .band');
    if(!selectFor) return;
    $('[data-select-for='+selectFor+']').removeClass('selected');
    $cell.addClass('selected');
    switch(selectFor){
      case 'digit1':
        currFirstDigit = +($cell.attr('data-digit'));
        $bands.eq(0).css('background-color',$cell.css('background-color'));
        break;
      case 'digit2':
        currSecondDigit = +($cell.attr('data-digit'));
        $bands.eq(1).css('background-color',$cell.css('background-color'));
        break;
      case 'multiplier':
        currMultiplierIdx = +($cell.attr('data-digit'));
        $bands.eq(2).css('background-color',$cell.css('background-color'));
        break;
    }
    updateReadout();
  }

  var currFirstDigit = 0;
  var currSecondDigit = 0;
  var currMultiplierIdx = 1;

  function updateReadout(){
    var text = (currFirstDigit || '') + '' + currSecondDigit + getMultiplierSuffixByIndex(currMultiplierIdx);
    $('#readout').text(text);
  }

  function createTable(){
    var $table = $('#codes');
    var i = 0;
    _.forOwn(colorDigits, function(color, digit){
      var $tr = $('<tr>');
      var mulText = getMultiplierTextByIndex(i);

      function mkTd(){
        var $td = $('<td>');
        $td.click(selectCell);
        $td.css('background-color', colors[color]).css('color', ((digit <= 1) || (digit == 6) || (digit == 7)) ? 'white' : 'black');
        return $td;
      }

      var $td = mkTd();
      $td.text(color.charAt(0).toUpperCase() + color.slice(1));
      $tr.append($td);

      if(isDigit(digit)) _.range(2).forEach(function(idx){
        var $td = mkTd();
        $td.text(digit).attr('data-select-for', 'digit'+(idx+1)).attr('data-digit',i);
        $tr.append($td);
      });

      else _.range(2).forEach(function(){
        var $td = mkTd();
        $td.css('background-color','transparent');
        $tr.append($td);
      });

      $td = mkTd();
      $td.attr('data-select-for','multiplier');
      if(mulText){
        $td.text(mulText).attr('data-digit', i);
      } else {
        $td.css('background-color','transparent').removeAttr('data-select-for');
      }
      $tr.append($td);


      $table.append($tr);

      i++;
    });
    $table.find('tr').first().find('[data-select-for]').each(function(){
      $(this).click();
    });
  }

  displayResistor(1234);

  createTable();


});
