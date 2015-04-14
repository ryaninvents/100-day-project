$(function(){
  var $canvas = $('canvas');

  var resize = $(window).asEventStream('resize').throttle(250).merge(Bacon.once()).map(function(){
    var width = $(window).width(),
        height = $(window).height();

    return {
      width: width,
      height: height
    };

  });

  var BLACK = [0, 0, 0];
  var BROWN = [166, 64, 0];
  var GREEN = [100, 180, 30];

  BLACK = linterpColors(0, BLACK, 1, BROWN, 0.3);

  function linterp(x1, y1, x2, y2, x){
    return (x - x1) / (x2 - x1) * (y2 - y1) + y1;
  }

  function arrayToRgb(a){
    return 'rgb('+a.map(function(n){return Math.round(n)}).join(',')+')';
  }

  function linterpColors(x1, color1, x2, color2, x){
    return _.range(3).map(function(i){
      return linterp(x1, color1[i], x2, color2[i], x);
    });
  }
  console.log(arrayToRgb(GREEN));
  console.log(arrayToRgb(linterpColors(0, GREEN, 1, BROWN, 0.3)))

  function getColorByAge(age){
    var BLACK_AGE = 9;
    var BROWN_AGE = 5;
    if(age < BROWN_AGE){
      return arrayToRgb(linterpColors(0, GREEN, BROWN_AGE, BROWN, age));
    } else if(age < BLACK_AGE){
      return arrayToRgb(linterpColors(BROWN_AGE, BROWN, BLACK_AGE, BLACK, age));
    } else return arrayToRgb(BLACK);
  }

  function getWidthByAge(age){
    var TWIG_GROWTH = 0.5;
    if(age < 3){
      return TWIG_GROWTH * age;
    } else if(age < 6){
      return (age - 3) * 2 + (TWIG_GROWTH * 3);
    } else {
      return (6 - 3) * 2 + (TWIG_GROWTH * 3);
    }
  }

  function Branch(opt){
    opt = _.clone(opt || {});
    this.relDist = opt.relDist || Math.random();
    this.relAngle = opt.relAngle || (Math.random() * 2 - 1);
    this.relLength = opt.relLength || (Math.random() * 0.6 + 0.38);
  }

  Branch.make = function(opt){
    switch(opt){
      case 0:
        return new Branch({relDist: 1, relAngle: Math.random()*0.1 - 0.05});
      case 1:
        return new Branch({relAngle: Math.random()*0.2 + 0.3});
      case 2:
        return new Branch({relAngle: -Math.random()*0.2 - 0.3});
    }
    return new Branch(opt);
  };

  function Tree(opt){
    var winWidth = $(window).width();
    opt = _.clone(opt || {});
    this.level = opt.level || 0;
    this.x = opt.x || (Math.random() * winWidth /*- winWidth / 2*/);
    this.y = opt.y || 0;
    this.angle = opt.angle || Math.PI/2;
    this.length = opt.length || Math.random() * 200 + 75;
    if(!opt.numBranches){
      opt.numBranches = 3;
    }
    if(opt.branches){
      this.branches = opt.branches;
    } else {
      this.branches = _.range(opt.numBranches).map(Branch.make);
    }
  }

  Tree.prototype.clone = function(){
    return new Tree(this);
  };

  Tree.prototype.asBranch = function(branch){
    var newTree = this.clone();
    var dist = this.length * branch.relDist;
    var length = this.length * branch.relLength;
    var angle = this.angle + branch.relAngle;
    newTree.angle = angle;
    newTree.length = length;
    newTree.x += Math.cos(this.angle) * dist;
    newTree.y += Math.sin(this.angle) * dist;
    newTree.level++;
    return newTree;
  };

  Tree.prototype.addAngle = function(angle){
    var t = this.clone();
    t.angle = angle;
    return t;
  }

  Tree.prototype.build = function(toLevel){
    if(this.level > toLevel) return [];
    var list = _.flatten(this.branches.map(function(branch){
      return this.asBranch(branch).build();
    }.bind(this)));
    list.push(this);
    return list;
  };

  var ctx = $canvas[0].getContext('2d');
  ctx.lineCap = 'round';

  Tree.prototype.draw = function(toLevel){
    if(toLevel == null) toLevel = 7;
    if(this.level > toLevel) return;
    ctx.strokeStyle = getColorByAge(toLevel - this.level);
    ctx.lineWidth = getWidthByAge(toLevel - this.level);
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x + Math.cos(this.angle) * this.length, this.y + Math.sin(this.angle) * this.length);
    ctx.closePath();
    ctx.lineCap = 'round';
    ctx.stroke();
    this.branches.forEach(function(branch){
      this.asBranch(branch).draw(toLevel);
    }.bind(this));
  }

  var trees = _.range(8).map(function(){
    return new Tree();
  });

  var time = 0;
  var MAX_TIME = 9;
  var GROWTH_SPEED = 1.1;

  function update(){
    time = MAX_TIME - (MAX_TIME - time) / GROWTH_SPEED;
    ctx.clearRect(0,0,$canvas[0].width,$canvas[0].height);
    trees.forEach(function(tree){
      tree.draw(time);
    });
    if((MAX_TIME - time) > 1e-2) {
      setTimeout(update, 250);
    }
  }

  update();

  resize.onValue(function(size){
    $canvas.attr('width', size.width).attr('height',size.height);
  });


});
