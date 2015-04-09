window.$(function () {
  var Bacon = window.Bacon,
      _ = window._,
      d3 = window.d3;

  var $dose = $('#dose'),
      $duration = $('#duration'),
      $mass = $('#mass'),
      $timeAgo = $('#minutes-ago');

  var COUCH_URL = "caffeine";
  var db = new EventsBin(COUCH_URL);

  var events = Bacon.fromPromise(db.fetch({limit:100})).map(function(result){
    var events = _.flatten(result.rows.map(function (row) {
      return row.values || row.value;
    }));
    events.sort(function(a,b){
      return +new Date(b.meta.ts) - +new Date(a.meta.ts);
    });
    return events;
  }).flatMap(Bacon.fromArray);

  var STARTER_DB = ([
    {
      name: 'coffee',
      sizes: [
        {
          name: 'medium',
          caffeine: 80
        }
      ]
    },
    {
      name: 'espresso',
      sizes: [
        {
          name: 'single',
          caffeine: 64
        }
      ]
    }
  ]).map(function(item){
    var meta = {
      class: 'ConsumableRecognized'
    };
    return {
      _id: item.name,
      meta: meta,
      data: item
    };
  });

  var consumables = events.filter(function(ev){
    return _.contains(['ConsumableRecognized', 'ConsumableUpdated'], (ev.meta && ev.meta.class));
  }).merge(Bacon.fromArray(STARTER_DB)).map(function(event){
    console.log(event);
    var x = {};
    x[event._id] = event;
    return x;
  }).scan([], function(a, b){
    var x = _.clone(a);
    _.values(b).forEach(function(ev){
      switch(ev.meta.class){
        case 'ConsumableRecognized':
          x.push(ev);
          break;
        case 'ConsumableUpdated':
          var update = ev;
          var event = _.where(x, {_id: ev.target});
          event.data = _.defaults(update.data, event.data);
          break;
      }
    });
    return x;
  });

  consumables.log('>>.');

  $('#add-log-entry').mkAddLogEntry(consumables);

  $('#add-log-entry').on('intent:add-entry', function(e, data){
    console.log('Adding log entry', data.beverage, data.size);
  });

  function valProp($el) {
    return $el.asEventStream('change').merge($el.asEventStream('keyup')).merge(Bacon.once()).map(function () {
      return +$el.val();
    }).toProperty();
  }

  var dose = valProp($dose);
  var duration = valProp($duration).map(function (d) {
    return d * 60000;
  });
  var timeAgo = valProp($timeAgo).map(function (d) {
    return d * 60000;
  });
  var mass = valProp($mass);

  var input = Bacon.combineTemplate({
    dose: dose,
    duration: duration,
    mass: mass,
    timeAgo: timeAgo
  });

  function calcCaffeine(input) {

    // Half-life of caffeine in the body
    var λ = 5 * 60 * 60000;

    // Absorption coefficient
    var α = 1 * 60 * 60000;

    // Liters of blood per kg of mass in the typical human
    var L = 0.007;

    // Convenience constants
    var k1 = -Math.log(2) / λ;
    var k2 = Math.log(1 / 20) / α;

    // User input
    var M = input.mass;
    var A = input.dose / input.duration;

    return function (t) {
      // Expression in brackets
      function inBrackets(u) {
        return Math.exp((k1 + k2) * (t - u)) / (k1 + k2)
             - Math.exp(k1 * (t - u)) / k1;
      }

      return A / (M * L) * (
        inBrackets(input.duration - input.timeAgo)
        - inBrackets(-input.timeAgo)
      );
    };
  }

  var amount = input.map(function (input) {
    return Math.max(calcCaffeine(input)(0), 0);
  });

  amount.map(function (a) {
    return 'Current concentration: ' + Math.round(a) + ' mg/dL';
  }).assign($('h3'), 'text');

  var graphData = input.map(function (input) {
    var caf = calcCaffeine(input);
    var x = _.range(-input.timeAgo / 60000, 480).map(function (n) {
      return n * 60000;
    });
    return x.map(function (t) {
      return { time: t, amount: caf(t) };
    }).filter(function(i){
      return i.amount >= 0;
    });
  });

  var margin = { top: 20, right: 20, bottom: 30, left: 50 },
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

  var x = d3.time.scale().range([0, width]);

  var y = d3.scale.linear().range([height, 0]);

  var xAxis = d3.svg.axis().scale(x).orient('bottom');

  var yAxis = d3.svg.axis().scale(y).orient('left');

  var line = d3.svg.line().x(function (d) {
      return x(d.time);
  }).y(function (d) {
      return y(d.amount);
  });

  var svg = d3.select('#graph').append('svg').attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom).append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  var $xAxis, $yAxis, $data;

  $xAxis = svg.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + height + ')');

  $yAxis = svg.append('g').attr('class', 'y axis').call(yAxis);

  $xAxis.append('text').attr('x', width).attr('dy', '-.71em').style('text-anchor', 'end').text('Time of day');

  $yAxis.append('text').attr('transform', 'rotate(-90)').attr('y', 6).attr('dy', '.71em').style('text-anchor', 'end').text('Concentration (mg/dL)');

  $data = svg.append('path').attr('class', 'line');

  graphData.onValue(function (data) {

      data.forEach(function (d) {
          d.time = +new Date(+new Date() + d.time);
          d.amount = +d.amount;
      });

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
});
