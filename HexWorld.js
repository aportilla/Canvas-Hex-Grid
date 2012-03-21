// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();


var HexWorld = function(){

    var tileManifest = function(){
        
        var actors = [];
        var manifest = {};
        
        return {
            addActor : function(){},
            removeActor : function(){},
            moveActor : function(){},
            tileEvent : function(eCode,x,y){}
        };
    };

    var hex = function(ctx,a,b,c,d,color,lncolor,lnwidth){
        ctx.fillStyle = color || 'coral';  
        ctx.strokeStyle = lncolor || 'rgba(0,0,0,0.4)';
        ctx.lineWidth = lnwidth || 1;
        ctx.beginPath();
        ctx.moveTo(0,b);
        ctx.lineTo(a,0);
        ctx.lineTo(a+c,d);
        ctx.lineTo(a+c,d);
        ctx.lineTo(2*c,b + 2*d);
        ctx.lineTo(2*c - a, 2*b + 2*d);
        ctx.lineTo(c - a, 2*b + d);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    };

    var rect = function(ctx,x,y,width,height,color){
        ctx.fillStyle = color || 'black';  
        ctx.fillRect(x,y,width,height);  
    };
    
    var circle = function(ctx,x,y,rad,color){
        ctx.strokeStyle = color || 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI*2, true); 
        ctx.closePath();
        ctx.stroke();
        //ctx.fill();
    };
    
    
/*
    var roundedRect = function(ctx,x,y,width,height,radius){
        ctx.beginPath();
        ctx.moveTo(x,y+radius);
        ctx.lineTo(x,y+height-radius);
        ctx.quadraticCurveTo(x,y+height,x+radius,y+height);
        ctx.lineTo(x+width-radius,y+height);
        ctx.quadraticCurveTo(x+width,y+height,x+width,y+height-radius);
        ctx.lineTo(x+width,y+radius);
        ctx.quadraticCurveTo(x+width,y,x+width-radius,y);
        ctx.lineTo(x+radius,y);
        ctx.quadraticCurveTo(x,y,x,y+radius);
        ctx.stroke();
    };
    
*/
    var line = function(ctx,fx,fy,tx,ty,color,width){
        ctx.strokeStyle = color || 'black';
        ctx.lineWidth = width || 1;
        ctx.beginPath();
        ctx.moveTo(fx,fy);
        ctx.lineTo(tx,ty);
        ctx.closePath();
        ctx.stroke();
    };
    
    var tuple = function(){
    
        var x,y,ox,oy,isNew,callback = function(){};
    
        return {
            value : function(){
                return {x:x,y:y};
            },
            set : function(nx,ny){
                if (nx != x || ny != y){
                    ox = x;
                    oy = y;
                    x = nx;
                    y = ny;
                    callback(x,y,ox,oy);
                }
            },
            onChange : function(cfn){
                if (typeof cfn == 'function'){
                    callback = cfn;
                }
            }
        };
    };
    
    var calculateInterceptRow = function(x,y,rowSep,slope,offset){
        return Math.floor(((y - slope * x) - offset) / rowSep);
    };
    
    /*
     * Determine the xHexRow as a function of
     * the xRow and the zRow
     *
     * Determine the yHexRow as a function of
     * the yRow and the xRow 
     *
     */
    var pixelsToHex = function(x,y,a,b,c,d){    
    
        var xSlope = -b / a,
            ySlope = d / c,
            zSlope = -(b + d) / (a - c),
            ySep = b - (ySlope * -a),
            xSep = d - (xSlope * c),
            zSep = d - (zSlope * c),
            xRow = calculateInterceptRow(x,y,xSep,xSlope,b),
            yRow = calculateInterceptRow(x,y,ySep,ySlope,b) + 1,
            zRow = calculateInterceptRow(x,y,zSep,zSlope,b) - 1;

        return {
            x : Math.round((xRow + zRow) / 3),
            y : Math.floor((yRow + xRow) / 3)
        };
    };
    
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

    /*
     * point
     * origin
     * degrees
     *
     */
    var rotatePoint = function(p, o, d){
    
        var r = d * (Math.PI/180),
            cosr = Math.cos(r),
            sinr = Math.sin(r),
            rpx = p.x - o.x, 
            rpy = p.y - o.y,
            np = {
                x : rpx * cosr - rpy * sinr,
                y : sinr * rpx + cosr * rpy
            };
        
        np.x += o.x;
        np.y += o.y;
        
        return np;
    };

 
    /*
     * r : hex radius ( in pixels )
     * d : degree rotation ( 0 ... 60 )
     * p : perspective (0 ... 1)
     *
     *
     * @NOTE : there's some rounding going
     *         on here to ensure that the
     *         vertices of the hex grid will
     *         always fall cleanly onto the
     *         pixel grid.  This will distort
     *         the rendered grid slightly
     *         from the exact input specs
     *         and prevents fine-tuned 
     *         adjustments for the sake of
     *         quality line rendering.
     */
    var getHexConfig = function(r,d,p){
    
        var refPoint = {x:r,y:0};
        var pA = rotatePoint(refPoint,{x:0,y:0},d);
        var pB = rotatePoint(pA,{x:0,y:0},-60);
        
        return {
            a : Math.abs(Math.round(pA.x)),
            b : Math.abs(Math.round(pA.y * p)),
            c : Math.abs(Math.round(pB.x)),
            d : Math.abs(Math.round(pB.y * p))
        };
        
    };


    return function(p,my){
    
        var that = aFrame.event();
        my = my || {};

        my.el = document.createElement('canvas');
        my.context = my.el.getContext('2d');
        my.mouseEvents = aFrame.getMouseEvents(my.el);
        my.hoverColor = '#222';
        my.drawDirty = false;
        my.tileManifest = {};
        my.dirtyTiles = [];
        my.actors = {};
        
        my.viewWidth = 0;
        my.viewHeight = 0;
        
        my.viewPosX = 300;
        my.viewPosY = 0;
        
        my.hexRadius = 10;
        my.rotation = 10;
        my.perspective = .7;
        
        my.a = 0;
        my.b = 0;
        my.c = 0;
        my.d = 0;
    
        // visible hex grid bounds
        my.lowX = 0;
        my.lowY = 0;
        my.highX = 0;
        my.highY = 0;
        
        my.updateHexConfig = function(){
            var coords = getHexConfig(my.hexRadius,my.rotation,my.perspective);
            my.a = coords.a;
            my.b = coords.b;
            my.c = coords.c;
            my.d = coords.d;
        };
        
        my.updateHexConfig();
        
        my.curHover = new tuple();
        
        my.curHover.onChange(function(x,y,ox,oy){

            //my.drawTile(ox,oy);
            //my.drawTile(x,y,my.hoverColor);    
            var newHoverTargets = my.tileManifest[x + ':' + y];
            var oldHoverTargets = my.tileManifest[ox + ':' + oy]; 
            if (oldHoverTargets){
                var tCount = oldHoverTargets.length;
                for (var i=0; i<tCount; i++){
                    if (oldHoverTargets[i]){
                        my.actors[oldHoverTargets[i]].fire('hover:off');
                    }
                }
            }
            
            if (newHoverTargets){
                //console.log('hover over : ' + x + ':' + y);
                //console.log(newHoverTargets);
                var tCount = newHoverTargets.length;
                for (var i=0; i<tCount; i++){  
                    my.actors[newHoverTargets[i]].fire('hover:on');
                }
            }
            
            that.fire('hover:off',{x:ox,y:oy});
            that.fire('hover:on',{x:x,y:y});
            
        });
        
        my.drawTile = function(x,y,color){
        
            x = x || 0;
            y = y || 0;
            
            var ctx = my.context;
            var pos = hexToPixels(x,y,my.a,my.b,my.c,my.d);
            var randInt = (Math.abs(96557 * x - y) >>> Math.abs(33461 * y + x)) + (Math.abs(7561 * y - x) >>> Math.abs(28657 * x - y));
            var mod = randInt%4;
            
/*
            if (mod === 0){
                var bgcolor = '#1a1a1a';
            } else if (mod === 1){
                var bgcolor = '#171717';
            } else if (mod === 2){
                var bgcolor = '#141414';
            } else {
                var bgcolor = '#1d1d1d';
            }
*/

            if (mod === 0){
                var bgcolor = '#224422';
            } else if (mod === 1){
                var bgcolor = '#224622';
            } else if (mod === 2){
                var bgcolor = '#224822';
            } else {
                var bgcolor = '#224a22';
            }

/*
            var mod = result%4;
            if (mod === 0){
                var bgcolor = 'red';
            } else if (mod === 1){
                var bgcolor = 'blue';
            } else if (mod === 2){
                var bgcolor = 'green';
            } else {
                var bgcolor = 'yellow';
            }
*/

            ctx.save();
            ctx.translate(pos.x + my.viewPosX,pos.y + my.viewPosY);
            hex(ctx,my.a,my.b,my.c,my.d,(color || bgcolor),'#123412');
            //ctx.fillStyle = "rgba(255,255,255,0.5)"; 
            //ctx.fillText(x+'  '+y, 20,20); 
             
            // get actors out of the manifest and render them...
            var localActors = my.tileManifest[x + ':' + y];
            
            //console.log(localActors);
            
            if (localActors){
                //console.log('actors : ' + x + ':' + y);
                var laCount = localActors.length;
                var xCenter = my.c;
                var yCenter = my.b + my.d;
                
                for (var i=0; i<laCount; i++){  
                    my.actors[localActors[i]].render( ctx, xCenter, yCenter, my.a, my.b, my.c, my.d );
                }
            }
            
            ctx.restore();
        };
         
        that.setHexRadius = function(hr){
            my.hexRadius = hr;
            my.updateHexConfig();
            return that;
        };
    
        that.setRotation = function(r){
            my.rotation = r;
            my.updateHexConfig();
            return that;
        };
            
        that.setPerspective = function(p){
            my.perspective = p;
            my.updateHexConfig();
            return that;
        };
        
        that.into = function(parent){
            parent.appendChild(my.el);
            return that;
        };
        
        that.draw = function(){
        
            //var startTime = (new Date()).getTime();
            
            var xSize = window.innerWidth;
            var ySize = window.innerHeight;
            
            var tl = pixelsToHex(0 - my.viewPosX,0 - my.viewPosY,my.a,my.b,my.c,my.d);
            var tr = pixelsToHex(xSize - my.viewPosX,0 - my.viewPosY,my.a,my.b,my.c,my.d);
            var bl = pixelsToHex(0 - my.viewPosX, ySize - my.viewPosY,my.a,my.b,my.c,my.d);
            var br = pixelsToHex(xSize - my.viewPosX,ySize - my.viewPosY,my.a,my.b,my.c,my.d);
            
            my.lowX = Math.min(tl.x,tr.x,bl.x,br.x);
            my.lowY = Math.min(tl.y,tr.y,bl.y,br.y);
            my.highX = Math.max(tl.x,tr.x,bl.x,br.x);
            my.highY = Math.max(tl.y,tr.y,bl.y,br.y);

            my.el.width = xSize;
            my.el.height = ySize;

            var ctx = my.context;
            
            //ctx.translate(.5,.5);
            
            for (var i=my.lowX;i<=my.highX;i++) {  
                for (var j=my.lowY;j<=my.highY;j++) {
                    my.drawTile(i,j);
                }  
            } 
            
            //var endTime = (new Date()).getTime();
            //console.log('DRAW time: ' + (endTime - startTime));
            
            return that;
        };
        
        (function animloop(){
            
            requestAnimFrame(animloop);
            
            // if the page is dirty, redraw it
            if (my.drawDirty){
                that.draw();
                my.drawDirty = false;
                
            // if any individual tiles are dirty
            // then redraw them...
            }
            
            if (my.dirtyTiles.length) {
                
                var dirtyCount = my.dirtyTiles.length;
                var pos;
                var posarr;
                var dirtyKeys = {};
                //console.log('dirty count: ' + dirtyCount);
                for (var i=0; i<dirtyCount; i++){
                    pos = my.dirtyTiles[i];
                    if (dirtyKeys[pos]){ continue; }
                    dirtyKeys[pos] = true;
                    posarr = pos.split(':');
                    //console.log('drawing tile - ' + pos);
                    my.drawTile(parseInt(posarr[0]),parseInt(posarr[1]));
                }
                
                my.dirtyTiles = [];
            }
            
        })();
        
        
        // left
        aFrame.keyEvents.on('keydown-37',function(){
            aFrame.step('scan_horizontal','easeOutSine',my.viewPosX,200,400,function(n){
				my.viewPosX = n;
                my.drawDirty = true;
            });
        });
        
        // up
        aFrame.keyEvents.on('keydown-38',function(){
            aFrame.step('scan_vertical','easeOutSine',my.viewPosY,200,400,function(n){
				my.viewPosY = n;
                my.drawDirty = true;
            });
        });
        
        // right
        aFrame.keyEvents.on('keydown-39',function(){
            aFrame.step('scan_horizontal','easeOutSine',my.viewPosX,-200,400,function(n){
				my.viewPosX = n;
                my.drawDirty = true;
            });
        });
        
        // down
        aFrame.keyEvents.on('keydown-40',function(){
            aFrame.step('scan_vertical','easeOutSine',my.viewPosY,-200,400,function(n){
				my.viewPosY = n;
                my.drawDirty = true;
            });
        });
        
        document.body.addEventListener('touchmove', function(event) {
            event.preventDefault();
        }, false); 
        
        my.mouseEvents.on('move',function(e){
            var pos = aFrame.getEventPosition(e);
            var hexCoord = pixelsToHex(pos.x - my.viewPosX,pos.y - my.viewPosY,my.a,my.b,my.c,my.d);
            my.curHover.set(hexCoord.x,hexCoord.y);
        });

        my.mouseEvents.on('down',function(){
        
            my.hoverColor = '#432';
            var hexpos = my.curHover.value();
            
            var eTargets = my.tileManifest[hexpos.x + ':' + hexpos.y];
            var actors = [];
            if (eTargets){
                var tCount = eTargets.length;
                for (var i=0; i<tCount; i++){
                    if (eTargets[i]){
                        my.actors[eTargets[i]].fire('touch:start');
                        actors.push(my.actors[eTargets[i]]);
                    }
                }
            }
            
            that.fire('touch:start',{
                x : hexpos.x,
                y : hexpos.y,
                actors : actors
            });
            
            //my.drawTile(hexpos.x,hexpos.y,my.hoverColor);
            //my.pingTile(hexpos.x,hexpos.y);
            //env.addActor(HexPawn({ x:hexpos.x, y:hexpos.y }));
        });

        my.mouseEvents.on('up',function(){
            my.hoverColor = '#222';
            var hexpos = my.curHover.value();
            
            var eTargets = my.tileManifest[hexpos.x + ':' + hexpos.y]; 
            if (eTargets){
                var tCount = eTargets.length;
                for (var i=0; i<tCount; i++){
                    if (eTargets[i]){
                        my.actors[eTargets[i]].fire('touch:end');
                    }
                }
            }
            
            that.fire('touch:end',hexpos);
            
            //my.drawTile(hexpos.x,hexpos.y);
            //my.pingTile(hexpos.x,hexpos.y);
            //env.addActor(HexPing({ x:hexpos.x, y:hexpos.y }));
        });
        
        aFrame.addListener('resize',window,function(e){
            my.drawDirty = true;
        });
        
        that.addActor = function(){
            
            var uid = 0;
            
            return function(obj){
                
                obj.setId(++uid);
                
                obj.setPerspective(my.a,my.b,my.c,my.d);
                
                my.actors[obj.getId()] = obj;
                var posKey = obj.getPosKey();
                // @todo create a tileManifest class for managing this...
                var manifest = my.tileManifest[posKey] || function(){
                    my.tileManifest[posKey] = [];
                    return my.tileManifest[posKey];
                }();
                
                manifest.push(obj.getId());
                
                //my.tileManifest[posKey] = manifest;
                //console.log(manifest);
                my.dirtyTiles.push(posKey);
                
                obj.on('remove',function(){
                    //console.log('remove');
                    // remove from tile manifest
                    var k = obj.getPosKey();
                    var curmanifest = my.tileManifest[k] || [];

                    var mCount = curmanifest.length;
                    for (var i=0; i<mCount; i++){
                        if (curmanifest[i] === obj.getId()){
                            curmanifest.splice(i,1);
                            break; 
                        }
                    }
                    
                    my.tileManifest[k] = curmanifest;
                    my.dirtyTiles.push(k);
                    //console.log('object removed from tile: ' + obj.getPosKey());
                    
                });
                
                obj.on('insert',function(){
                    var k = obj.getPosKey();
                    var manifest = my.tileManifest[k] || [];
                    manifest.push(obj.getId());
                    my.tileManifest[k] = manifest;
                    my.dirtyTiles.push(k);
                    //console.log('object inserted into tile: ' + obj.getPosKey());
                });
                
                /*
                 * passing the 'all' option will render 
                 * the full set before updating the dirty tile
                 * which is usefull for animations that may
                 * overlap into neighboring tiles.
                 */
                obj.on('dirty',function(opt){
                    if (opt && opt.all === true){
                      my.drawDirty = true;
                    }
                    my.dirtyTiles.push(obj.getPosKey());
                });
                
                obj.on('destroy',function(){
                    
                    // remove from tile manifest
                    var manifest = my.tileManifest[obj.getPosKey()] || [];
                    var mCount = manifest.length;
                    for (var i=0; i<mCount; i++){
                        if (manifest[i] === obj.getId()){ 
                            manifest.splice(i,1); 
                            break; 
                        }
                    }
                    
                    // remove from actors hash
                    delete my.actors[obj.getId()];
                    
                    // dirty its parent tile
                    //console.log('destroying: ' + obj.getPosKey());
                    my.dirtyTiles.push(obj.getPosKey());
                    
                });
                
                obj.init();
                
                return that;
            };

        }();    
              
        return that;
    };
    
}();