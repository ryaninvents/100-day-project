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

  var publishBus = new Bacon.Bus();

  function publish(_class, event){
    db.publish(_class, event).then(function(data){
      publishBus.push(data);
    });
  }

  publishBus.log('publishBus >> ');

  publish('BrowserPageOpened', {
    location: document.location.href
  });

  var events = Bacon.fromPromise(db.fetch({limit:100})).map(function(result){
    var events = _.flatten(result.rows.map(function (row) {
      return row.values || row.value;
    }));
    events.sort(function(a,b){
      return +new Date(b.meta.ts) - +new Date(a.meta.ts);
    });
    return events;
  }).flatMap(Bacon.fromArray).merge(publishBus);

  var STARTER_DB = ([
    {
      name: 'coffee',
      _id: '34c85f59-aa69-4f86-8562-c9b28320a717',
      sizes: [
        {
          name: 'medium',
          caffeine: 80
        }
      ]
    },
    {
      name: 'espresso',
      _id: '499ac487-4bb9-461c-bc7a-da482858887a',
      sizes: [
        {
          name: 'single',
          caffeine: 64
        },
        {
          name: 'double',
          caffeine: 64*2
        }
      ]
    },
    {
      name: 'energy drink',
      id: 'a7f6f97d-11d0-49df-a387-553ce9c3e173',
      sizes: [
        {
          name: '8.4 oz',
          caffeine: 80
        },
        {
          name: '16 oz',
          caffeine: 140
        }
      ]
    }
  ]).map(function(item){
    var meta = {
      class: 'ConsumableRecognized'
    },
      _id = item._id;
    delete item._id;
    return {
      _id: _id,
      meta: meta,
      data: item
    };
  });

  var consumables = events.filter(function(ev){
    return _.contains(['ConsumableRecognized', 'ConsumableUpdated'], (ev.meta && ev.meta.class));
  }).merge(Bacon.fromArray(STARTER_DB)).map(function(event){
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
          var event = _.findWhere(x, {_id: ev.target});
          event.data = _.defaults(update.data, event.data);
          break;
      }
    });
    return x;
  });

  var consumption = events.filter(function(ev){
    return _.contains([
      'ConsumptionStarted',
      'ConsumptionCompleted',
      'ConsumptionDeleted'
    ], (ev.meta && ev.meta.class));
  }).scan([], function(a, b){
    console.log(arguments);
    a = _.clone(a);
    b.data = b.data || {};
    switch(b.meta.class){
      case 'ConsumptionStarted':
        b.data.duration = 20*60e3;
        a.push(b);
        break;
      case 'ConsumptionCompleted':
        var event = _.findWhere(a, {_id: b.completes});
        event.duration = +new Date(b.meta.ts) - +new Date(a.meta.ts);
        break;
      case 'ConsumptionDeleted':
        return a.filter(function(event){
          return event._id !== b.data.deletes;
        });
        break;
    }
    return a;
  });

  var $addLogEntry = $('#add-log-entry');
  $addLogEntry.mkAddLogEntry(consumables);

  $addLogEntry.on('intent:add-entry', function(e, data){
    console.log('Adding log entry', data.beverage, data.size);
    publish('ConsumptionStarted', {
      data: data
    });
  });

  $('#chart').mkCoffeeChart({
    consumables: consumables,
    consumption: consumption
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

  var amount = input.map(function (input) {
    return Math.max(calcCaffeine(input)(0), 0);
  });

  amount.map(function (a) {
    return 'Current concentration: ' + Math.round(a) + ' mg/dL';
  }).assign($('h3'), 'text');

});
