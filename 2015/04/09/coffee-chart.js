$.fn.mkCoffeeChart = function(opts){
  var $this = $(this);

  var consumables = opts.consumables,
      consumption = opts.consumption;

  consumables.log('csb');
  consumption.log('csp');

  var range = Bacon.interval(10000).merge(Bacon.once()).map(function(){
    var now = +new Date();
    var midnight = new Date(); midnight.setHours(0,0,0,0);
    var PAST = Math.max(now - midnight, 6*60*60e3); // show everything since midnight, or 6 hrs of the past
    var FUTURE = 6*60*60e3; // show 6 hrs of the future
    var INTERVAL = 2*60e3; // every 2 mins
    return _.range(now-PAST, now+FUTURE, INTERVAL);
  });

  var graphData = Bacon.combineTemplate({
    consumables: consumables,
    consumption: consumption,
    range: range
  }).map(function(input){
    var range = input.range;
    var cafFunx = input.consumption.map(function(c){
      return calcCaffeine({
        start: +new Date(c.meta.ts),
        end: +new Date(c.meta.ts) + c.data.duration,
        mass: 68,
        dose: 80,
        duration: c.data.duration
      });
    });
    return range.map(function(t){
      var x = cafFunx.reduce(function(sum, f){
        return sum + Math.max(f(t),0);
      }, 0);
      return {
        time: new Date(t),
        amount: x
      };
    });
  });

  var margin = { top: 20, right: 20, bottom: 30, left: 30 },
      width = $('body').innerWidth() - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

  var x = d3.time.scale().range([0, width]);

  var y = d3.scale.linear().range([height, 0]);

  var xAxis = d3.svg.axis().scale(x).orient('bottom');

  var yAxis = d3.svg.axis().scale(y).orient('left');

  var line = d3.svg.line().x(function (d) {
      return x(d.time);
  }).y(function (d) {
      return y(d.amount);
  });

  var svg = d3.select($this[0]).append('svg').attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom).append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  var $xAxis, $yAxis, $data;

  $xAxis = svg.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + height + ')');

  $yAxis = svg.append('g').attr('class', 'y axis').call(yAxis);

  $xAxis.append('text').attr('x', width).attr('dy', '-.71em').style('text-anchor', 'end').text('Time of day');

  $yAxis.append('text').attr('transform', 'rotate(-90)').attr('y', 6).attr('dy', '.71em').style('text-anchor', 'end').text('Concentration (mg/dL)');

  $data = svg.append('path').attr('class', 'line');

  graphData.onValue(function (data) {

      x.domain(d3.extent(data, function (d) {
          return d.time;
      }));
    var yDomain = d3.extent(data, function (d) {
          return d.amount;
      });
    yDomain[0] = 0;
      y.domain(yDomain);

      svg.select('.x.axis').call(xAxis);

      svg.select('.y.axis').call(yAxis);

      $data.datum(data).attr('class', 'line').attr('d', line);
  });
};
