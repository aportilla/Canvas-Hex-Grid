
/*
 * Takes hex-grid X,Y and converts to 
 * pixel X,Y coords based on the 
 * current hex perspective (a,b,c,d)
 */
var hexToPixels = function(x,y,a,b,c,d){
  var xc = x + y,
    yc = (-3 * y) + xc;
  return {
    x : (xc * c) + (yc * a),
    y : -((xc * -d) + (yc * b))
  };
};

var hexNeighbors = function(x,y){
  return [
    [x+1,y+1],
    [x+1,y],
    [x,y+1],
    [x,y-1],
    [x-1,y],
    [x-1,y-1]
  ];
};

// the number of hex moves between two hex coordinates
var hexDistance = function(xA,yA,xB,yB){
  var xDif = xB - xA;
  var yDif = yB - yA;
  return Math.max(Math.abs(xDif),Math.abs(yDif),Math.abs(xDif - yDif));
};

var lineSlope = function(xA,yA,xB,yB){
  return (yA - yB) / (xA - xB);
};

var yIntercept = function(m,x,y){
  return y - (m * x);
};

var distance = function(xA,yA,xB,yB){
  return Math.sqrt(Math.pow(Math.abs(xA - xB),2) + Math.pow(Math.abs(yA - yB),2));
};


/*
 * Hex Line
 *
 * There are many paths on a hex grid that
 * will go from piont A to B with the same
 * number of steps,  this function returns
 * one of them that approximates an 
 * as-the-crow-flights direct route, rather
 * than simply following one axis and then
 * another.
 * 
 * @return an array of adjacent points
 *     directly between points A and B
 *
 */
var hexLine = function(xA,yA,xB,yB){

  var result = [xA + ':' + yA],
    slope = xA === xB ? 1000000 : lineSlope(xA,yA,xB,yB),
    hexDist = hexDistance(xA,yA,xB,yB),
    yInt = yIntercept(slope,xA,yA),
    xDiff = xB - xA,
    yDiff = yB - yA,
    xC = xA,
    yC = yA,
    incA,
    incB,
    aTest,
    bTest;

  // 0,-1  1,0  1,1  0,1
  if (xB > xA) {
    if (yB > yA) {
      incA = [1,1];
      incB = (Math.abs(xDiff) > Math.abs(yDiff)) ? [1,0] : [0,1];
    } else {
      incA = [0,-1];
      incB = [1,0];
    } 
  // 0,-1  -1,-1  -1,0  0,1
  } else {
    if (yB > yA) {
      incA = [-1,0];
      incB = [0,1];
    } else {
      incA = [-1,-1];
      incB = (Math.abs(xDiff) > Math.abs(yDiff)) ? [-1,0] : [0,-1];
    }
  }
  
  for (var i=0; i<hexDist; i++){
    aTest = Math.abs(yIntercept(slope,xC + incA[0],yC + incA[1]) - yInt);
    bTest = Math.abs(yIntercept(slope,xC + incB[0],yC + incB[1]) - yInt);
    if (aTest < bTest) {
      xC += incA[0];
      yC += incA[1];
    } else {
      xC += incB[0];
      yC += incB[1];
    }
    result.push(xC + ':' + yC);
  }
  
  return result;

};



var HexActor = function(p,my){

  my = my || {};
  p = p || {};
  var that = aFrame.event();
  
  my.id = p.id || '';
  my.x = p.x || 0;
  my.y = p.y || 0;
  my.a = 1;
  my.b = 1;
  my.c = 1;
  my.d = 1;
  my.offsetX = 0;
  my.offsetY = 0;
  
  that.type = 'default';
  
  that.setPerspective = function(a,b,c,d){ 
    my.a = a;
    my.b = b;
    my.c = c;
    my.d = d;
  };
  
  that.render   = function(ctx){};
  that.init     = function(ctx){};
  that.setId    = function(id){ my.id = id; };
  that.getId    = function(){ return my.id; };
  that.getX     = function(){ return my.x; };
  that.getY     = function(){ return my.y; };
  that.getXY    = function(){ return { x:my.x, y:my.y }; };
  that.getPosKey  = function(){ return my.x + ":" + my.y };
  
  that.setXY = function(x,y){
    my.x = x;
    my.y = y;
    that.fire('dirty');
    return that;
  };
  
  return that;

};

var HexPawn = function(p,my){
  
  my = my || {};
  
  my.bgColor = 'rgba(255,255,255,0.3)';

  var that = HexActor(p,my);
  
  that.type = 'pawn';
  
  that.render = function(ctx,xpos,ypos){
    ctx.fillStyle = my.bgColor;  
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(xpos, ypos, 10, 0, Math.PI*2, true); 
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };
  
  that.on('hover:on',function(){
    my.bgColor = 'rgba(255,255,255,0.9)';
    that.fire('dirty');
  });
  
  that.on('hover:off',function(){
    my.bgColor = 'rgba(255,255,255,0.3)';
    that.fire('dirty');
  });
  
  return that;
};

var HexPing = function(p,my){

  my = my || {};
  var that = HexActor(p,my);
  
  that.type = 'ping';
  
  my.curSize = 0;
  my.curColor = 'blue'
  
  that.render = function(ctx,xpos,ypos){
    ctx.strokeStyle = my.curColor;
    ctx.beginPath();
    ctx.arc(xpos, ypos, my.curSize, 0, Math.PI*2, true); 
    ctx.closePath();
    ctx.stroke();
  };
  
  that.init = function(){
    //console.log('init:' + that.getId());
    aFrame.step('ping:' + that.getId(),'easeOutQuad',0,25,500,function(n){
      my.curSize = n;
      my.curColor = 'rgba(200,200,255,'+ ((25 - n) / 25) +')';
      that.fire('dirty');
    }).then(function(){
      //console.log('destroy:' + that.getId());
      that.fire('destroy');
    });
  };
  
  return that;
  
};

var HexHover = function(p,my){

  my = my || {};
  var that = HexActor(p,my);
  
  that.type = 'hover';
  
  my.pressed = false;
  
  that.render = function(ctx,xpos,ypos,a,b,c,d){
  
    a = a*.9;
    b = b*.9;
    c = c*.9;
    d = d*.9;
    
    ctx.fillStyle = 'coral';  
    
    
    ctx.save();
    ctx.translate(xpos - c,ypos - b - d);
      
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0,b);
    ctx.lineTo(a,0);
    ctx.lineTo(a+c,d);
    ctx.lineTo(a+c,d);
    ctx.lineTo(2*c,b + 2*d);
    ctx.lineTo(2*c - a, 2*b + 2*d);
    ctx.lineTo(c - a, 2*b + d);
    ctx.closePath();
    if (my.pressed){
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fill();
    }
    ctx.stroke();
    
    ctx.restore();
    
  };
  
  that.on('hover:off',function(){
    that.fire('destroy');
    that.fire('dirty');
  });
  
  that.on('touch:start',function(p){
    my.pressed = true;
    that.fire('dirty');
  });
  
  that.on('touch:end',function(p){
    my.pressed = false;
    that.fire('dirty');
  });
  
  return that;
};

var HexClickChaser = function(p,my){

  my = my || {};

  var that = HexActor(p,my);
  
  that.type = 'clickchaser';
  
  that.render = function(ctx,xpos,ypos){
    
    //console.log('render chaser');
    //console.log(arguments);
    
    ctx.save();
    ctx.translate(my.offsetX,my.offsetY);
  
    ctx.strokeStyle = 'coral';
    ctx.beginPath();
    ctx.arc(xpos, ypos, 20, 0, Math.PI*2, true); 
    ctx.closePath();
    ctx.stroke();
    
    ctx.restore();
  };
  
  /*
   * Custom Click Chaser Method
   */
  that.moveTo = function(x,y){
    
    var xDiff = x - my.x;
    var yDiff = y - my.y;
    var pDiff = hexToPixels(xDiff,yDiff,my.a,my.b,my.c,my.d);
    var m = pDiff.y / pDiff.x;
    var dist = hexDistance(my.x,my.y,x,y);
    aFrame.step('moving:' + that.getId(),'easeOutQuad',0,pDiff.x,Math.floor(dist * 150),function(n){

      my.offsetX = n;
      my.offsetY = m * n;
      that.fire('dirty',{ all : true });

    }).then(function(){
      
      that.fire('remove');
      that.fire('dirty');
      
      my.offsetX = 0;
      my.offsetY = 0;
      my.x = x;
      my.y = y;
      
      that.fire('insert');
      that.fire('dirty');

    });
    

    
  };
  
  return that;
};