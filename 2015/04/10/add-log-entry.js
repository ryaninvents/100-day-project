$.fn.mkAddLogEntry = function(consumables){
  $.get('add-log-entry.tpl').then(function(data){
    var $this = $(this);

    $this.html(data);

    var $cancelButton = $this.find('#btn-cancel'),
        $addButton = $this.find('#btn-add'),
        $beverage = $this.find('[data-field=beverage]'),
        $size = $this.find('[data-field=size]'),
        $caf = $this.find('[data-field=caffeine]');

    consumables.onValue(function(v){
      $beverage.empty().append(v.map(function(beverage){
        var $opt = $('<option>');
        $opt.attr('value',beverage._id).text(beverage.data.name);
        return $opt;
      }));
    });

    function valProp($el) {
      return $el.asEventStream('change').merge($el.asEventStream('keyup')).merge(Bacon.once()).map(function () {
        return $el.val();
      }).toProperty();
    }

    var beverage = valProp($beverage),
        size = valProp($size);

    Bacon.combineTemplate({
      beverage: beverage,
      consumables: consumables
    }).onValue(function(x){
      var bev = x.consumables.filter(function(cble){
        return cble._id === x.beverage;
      })[0];
      $size.empty().append(bev.data.sizes.map(function(size){
        var $opt = $('<option>');
        $opt.attr('value', size.name).text(size.name);
        return $opt;
      })).trigger('change');
    });

    $cancelButton.asEventStream('click').onValue(function(){
      $this.trigger('intent:cancel');
    }.bind(this));

    var formData = Bacon.combineTemplate({
      beverage: beverage,
      size: size,
      consumables: consumables
    });

    formData.map(function(x){
      var bev = x.consumables.filter(function(cble){
        return cble._id === x.beverage;
      })[0];
      var size = bev.data.sizes.filter(function(size){
        return size.name === x.size;
      })[0];
      return size ? size.caffeine : '';
    }).assign($caf, 'val');

    formData.sampledBy($addButton.asEventStream('click'))
      .onValue(function(data){
        $this.trigger('intent:add-entry', data);
      }.bind(this));
  }.bind(this));
  return this;
};
