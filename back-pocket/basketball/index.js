$(function(){
  var $angle = $('#angle'),
      $power = $('#power'),
      $shoot = $('#shoot'),
      $playArea = $('#play-area'),
      $ball = $playArea.find('.ball'),
      $arrow = $playArea.find('.arrow'),
      $basket = $playArea.find('.basket');

  var WIDTH = 600,
      HEIGHT = 400,
      BALL_RADIUS = 20,
      ACCELERATION = -(8e-5);

  function valProp($el) {
      return $el.asEventStream('change').merge($el.asEventStream('keyup')).merge(Bacon.once()).map(function () {
          return +$el.val();
      }).toProperty();
  }

  var angle = valProp($angle),
      power = valProp($power),
      shootClick = $shoot.asEventStream('click');

  var input = Bacon.combineTemplate({
    angle: angle,
    power: power
  });

  function Circle(opt){
    this.x = opt.x;
    this.y = opt.y;
    this.radius = opt.radius;
  }

  Circle.prototype.isCircle = true;

  Circle.prototype.collidesWith = function(that){
    if(that.isCircle){
      return Math.pow(this.x - that.x, 2) + Math.pow(this.y - that.y, 2) - Math.pow(this.radius, 2) - Math.pow(that.radius, 2) <= 0;
    } else {
      return that.collides(this);
    }
  };

  function Ball(opt){
    Circle.apply(this, arguments);
    this.vx = opt.vx || 0;
    this.vy = opt.vy || 0;
    this.radius = opt.radius || BALL_RADIUS;
    this.bounce = opt.bounce || 0.8;
  }

  Ball.prototype.isBall = true;

  Ball.prototype.moved = function(dt, world) {
    var dx = this.vx * dt;
    var dy = this.vy * dt;
    var newVy = this.vy + ACCELERATION * dt;
    if(this.y <= this.radius && newVy < 0) {
      newVy = -(this.bounce * newVy);
    }
    return new Ball({
      x: this.x + dx,
      y: Math.max(this.radius, this.y + dy),
      vx: this.vx,
      vy: newVy,
      radius: this.radius,
      bounce: this.bounce
    });
  };

  Ball.prototype.copy = function(alt){
    return new Ball({
      x: alt.x || this.x,
      y: alt.y || this.y,
      vx: alt.vx || this.vx,
      vy: alt.vy || this.vy,
      radius: alt.radius || this.radius,
      bounce: alt.bounce || this.bounce
    });
  }

  Ball.prototype.update = function(){
    $ball.css('left',this.x+'px').css('bottom',this.y+'px');
    return this;
  };

  function Box(opt){
    this.x = opt.x;
    this.y = opt.y;
    this.width = opt.width;
    this.height = opt.height;
  }

  Box.prototype.isBox = true;

  Box.prototype.asCircle = function(){
    if(this._circle){
      return this._circle;
    }
    var radius = Math.sqrt(0.25 * this.width * this.width + 0.25 * this.height * this.height);
    return this._circle = new Circle({
      x: this.x,
      y: this.y,
      radius: radius
    });
  };

  Box.prototype.collidesWith = function(that){

  };

  input.onValue(function(data){
    $arrow.css('transform','rotate('+(-data.angle)+'deg)').width(data.power+14);
  });

  var ball = new Ball({
    x: 50,
    y: 50
  });

  input.sampledBy(shootClick).onValue(function(input){
    var DT = 50,
        POWER_SCALE = 4e-3;

    ball = new Ball({
      x: 50,
      y: 50
    });

    ball = ball.copy({
      vx: POWER_SCALE * input.power * Math.cos(input.angle*Math.PI/180),
      vy: POWER_SCALE * input.power * Math.sin(input.angle*Math.PI/180)
    });
    var interval = setInterval(function(){
      ball = ball.moved(DT).update();
      if(ball.x < 0 || ball.x > WIDTH) clearInterval(interval);
    }, DT);
  });

});
