$(function(){
  var ELECTION_DAY = new Date("Nov 30, 2016 EST");
  var difference = +ELECTION_DAY - +new Date();

  var US_POPULATION = 318000000;
  var POPULATION_RATE = 0.01*US_POPULATION/(365*864e5);

  var HOC_LENGTH = (60*60e3)*39; // 1 hour * 39 episodes

  var FORREST_DISTANCE = 2160; // Auburn, AL to Santa Monica, CA; Greenbow doesn't exist
  var FORREST_PACE = 0.54 / (864e5/24); // http://www.centives.net/S/2012/forrest-gumps-running-route/
  var SHOE_COST = 119.99 * 1.0625; // Let's assume he bought them in Massachusetts

  $('#answer').text(difference > 0? 'NO.' : 'YES.');
  $('#elaboration').text('Election day is '+Math.floor(difference/864e5)+' days from now.');
  $('#hoc .repeats').text(Math.floor(difference / HOC_LENGTH));
  $('#population .increase').text(Math.floor(difference * POPULATION_RATE));
  $('#gump .repeats').text(Math.round(difference * FORREST_PACE / FORREST_DISTANCE * 100 / 2)/100);
  $('#gump .shoes').text(Math.round(difference * FORREST_PACE * SHOE_COST / 5 )/100);
});
