(function(){
  var location = {};
  var uuid = function b(a) {
    return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : ([10000000] + -1000 + -4000 + -8000 + -100000000000).replace(/[018]/g, b);
  };

  function EventsBin(location){
    this.pouch = new PouchDB(location);

    function updateLocation() {
      navigator.geolocation.getCurrentPosition(function (position) {
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude,
          accuracy: position.coords.accuracy,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: +position.timestamp
        };
      });
    }
    setInterval(updateLocation, 10000);
    updateLocation();
  }
  _.assign(EventsBin.prototype, {
    publish: function publish(_class, event) {
      var opts = arguments[2] === undefined ? {} : arguments[2];
      event._id = uuid();
      event.meta = event.meta || {};
      event.meta.ts = new Date().toString();
      event.meta["class"] = _class;
      event.meta.location = location;
      event.meta.userAgent = navigator.userAgent;
      console.log("Sending", event);
      if (!opts.attachments || !opts.attachments.length) {
        return this.pouch.put(event).then(function(response){
          event._id = response.id;
          return event;
        });
      }
      return this.pouch.put(event).then(function (doc) {
        var att = opts.attachments[0];
        return this.pouch.putAttachment(doc.id, att.name, doc.rev, att.blob, att.type).then(function(response){
          event._id = response.id;
          return event;
        });
      }.bind(this));
    },
    fetch: function fetch() {
      var opt = arguments[0] === undefined ? {} : arguments[0];
      return this.pouch.query(function (doc) {
        if (doc.meta && doc.meta.ts) {
          emit(+new Date(doc.meta.ts), doc);
        }
      }, {
        limit: opt.limit || 25,
        descending: true
      });
    }
  });

  window.EventsBin = EventsBin;

})();
