var hexgrid = (function(){

    /*
     * Grid
     */
    var gridInstance = function(p,my){
        
        my = my || {};
        var that = {};
        
        my.x = p.x || 0;
        my.y = p.y || 0;
        my.element = p.element || document.createElement('div');

        my.mouseEvents = aFrame.getMouseEvents(my.element);
        my.events = aFrame.event();        
        my.tileTable = [];
        my.hoverX = null;
        my.hoverY = null;
        my.downX = null;
        my.downY = null;
        my.viewX = 0;
        my.viewY = 0;
        my.isDragging = false;
        
        my.spriteOffset = p.spriteOffset || 0;
        
        my.aspect = p.aspect || {
            xx : 43,
            xy : -15,
            yy : 25,
            yx : 25
        };

        my.xx = my.aspect.xx;

        my.xy = my.aspect.xy;
        
        my.yy = my.aspect.yy;
        
        my.yx = my.aspect.yx;

        that.getX = function(){
            return my.x;
        };
        
        that.getY = function(){
            return my.y;
        };
        
        that.getElement = function(){
            return my.element;
        };
        
        /*
         * @return void
         */
        that.recalculatePosition = function(e){
            my.gridPosition = aFrame.getElementPosition(my.element);
        };
        
        /*
         * @return tile instance || false
         */
        my.getTile = function(tuple){

            var foundTile;
            
            try {
                foundTile = my.tileTable[tuple[1]][tuple[0]];
            } catch(err) {
            
            }
            
            if (!foundTile){
                foundTile = false;
            }
            
            return foundTile;
            
        };
        
        /*
         * @return void
         */
        my.handleMousedown = function(){
        
            my.isDragging = true;
            
            if (my.hoverX === null || 
                my.hoverY === null){
                return;
            }
            
            my.downX = my.hoverX;
            my.downY = my.hoverY;
            
            my.events.fire('click', [my.hoverX,my.hoverY]);
        };
        
        /*
         * @return void
         */
        my.handleMouseup = function(){
            my.events.fire('clickEnd', [my.hoverX,my.hoverY]);
            my.isDragging = false;
        };
        
    
        /*
         * 
         */
        my.mouseCoordToHexCoord = function(){
            
            var xx = my.aspect.xx,
                xy = my.aspect.xy,
                yx = my.aspect.yx,
                yy = my.aspect.yy,
                xSlope = xy / xx,
                ySlope = yy / yx,
                zSlope = (-yy + xy) / (xx - yx),
                xOffset = - (xx - yx),
                yOffset = xy,
                xRow,
                yRow,
                zRow,
                xHex,
                yHex,
                getRowMethod = function(slope,xA,yA){
    
                    if (!isFinite(slope)){
                        
                        return function(x,y){
                            return Math.floor(x / xA);
                        };
                        
                    }
                    
                    if (slope === 0) {
                        
                        return function(x,y){
                            return Math.floor(y / yA);
                        };
                        
                    }
                    
                    var lineSeperation = yA - (slope * xA);
                    
                    return function(x,y){
                        return Math.floor((-((slope * x) - y)) / lineSeperation);
                    };
                    
                },
                getXrow = getRowMethod(ySlope,xx,xy),
                getYrow = getRowMethod(xSlope,yx,yy),
                getZrow = getRowMethod(zSlope,yx,yy);
            
            return function(x,y){
                
                /*
                 * Offset the mouse coordinates so that 0,0 is
                 * based on the SW vertex of the 0,0 hex.
                 */
                x += xOffset;
                y += yOffset;
                
                /*
                 * Calculate the x,y,z rows based on the 
                 * y-intercepts of the xyz slopes.
                 */
                xRow = getXrow(x,y);
                yRow = getYrow(x,y);
                zRow = getZrow(x,y);
                
                /*
                 * Determine the yHexRow as a function of
                 * the yRow and the xRow
                 * 
                 * Determine the xHexRow as a function of
                 * the xRow and the zRow
                 */
                yHex = Math.floor((yRow - xRow) / 3);
                xHex = Math.round((xRow + zRow) / 3);
                
                /*
                 * Return coord tuple
                 */
                return [xHex,yHex];
            
            };
            
        }();

        
        /*
         * Use the x and y axis slopes to calculate the 
         * Y-intercepts of grid lines extending from the 
         * exact mouse position over the grid.
         * 
         * The tile being hovered over is calculated
         * as a function of the Y-intercept and the seperation
         * between the grid lines.
         *
         * y = (slope)x + (yIntercept)
         * 
         * @return void
         */
        my.handleMousemove = function(){
        
            var mousePos,
                x,
                y,
                hexCoord,
                hoverTile;
        
            return function(e){
            
                aFrame.stopEvent(e);
                mousePos = aFrame.getEventPosition(e);
                x = mousePos.x - my.gridPosition.x;
                y = -((mousePos.y - my.gridPosition.y) - my.height);
                
                hexCoord = my.mouseCoordToHexCoord(x,y);
                
                if (hexCoord[0] === my.hoverX && 
                    hexCoord[1] === my.hoverY){
                    return;
                }
                
                if (my.hoverX != null && 
                    my.hoverY != null){
                    my.events.fire('leave:' + my.hoverX + 'x' + my.hoverY);
                    my.tileTable[my.hoverY][my.hoverX].setHover(false);
                }
                
                hoverTile = my.getTile(hexCoord);
                
                if (!hoverTile){
                
                    my.hoverX = null;
                    my.hoverY = null;
                    
                    return;
                }
                
                my.events.fire('hover', hexCoord);
                
                hoverTile.setHover(true,my.toolType);
                
                my.hoverX = hexCoord[0];
                my.hoverY = hexCoord[1];
                
                if (my.isDragging){
                    my.events.fire('drag', hexCoord);
                    my.events.fire('dragLine', {
                        length : AP.grid.hexDistance(my.downX,my.downY,hexCoord[0],hexCoord[1]),
                        cells : AP.grid.getHexLine(my.downX,my.downY,hexCoord[0],hexCoord[1])
                    });
                }
            
            };
        
        }();
        
        /*
         * @return object literal with x:y coordinate positions
         */
        that.getPosition = function(tuple){
            
            var xCoord = tuple[0] - tuple[1];
            var yCoord = (3 * tuple[1]) + xCoord;
            
            return {
                x : (xCoord * my.xx) + (yCoord * my.yx),
                y : (xCoord * my.xy) + (yCoord * my.yy)
            };
        };
        
        
        /*
         * @return void
         */
        my.addTile = function(tuple){
            
            var pos = that.getPosition(tuple);

            my.tileTable[tuple[1]][tuple[0]] = (new Tile(14,14,20,4)).left(pos.x)
                                                         .bottom(pos.y)
                                                         .into(my.element);
            
        
        };
        
        /*
         * @return void
         */
        my.setViewPosition = function(x,y){
            
            my.viewX = x;
            my.viewY = y;
            
            var xOffset = (x * my.xx) + (y * my.yx);
            var yOffset = -((x * my.xy) + (y * my.yy));
            
            my.element.style.marginLeft =  - Math.floor(my.width / 2) + xOffset + 'px';
            my.element.style.marginTop = - Math.floor(my.height / 2) + yOffset + 'px';
        
        };
         
        /*
         * @return void
         */
        my.handleLeftArrow = function(e){
            my.setViewPosition((my.viewX + 1), (my.viewY + 1));
            that.recalculatePosition();
        };
        my.handleUpArrow = function(e){
            my.setViewPosition((my.viewX + 1), (my.viewY - 1));
            that.recalculatePosition();
        };
        my.handleRightArrow = function(e){
            my.setViewPosition((my.viewX - 1), (my.viewY - 1));
            that.recalculatePosition();
        };
        my.handleDownArrow = function(e){
            my.setViewPosition((my.viewX - 1), (my.viewY + 1));
            that.recalculatePosition();
        };
        
        
        /*
         * @return table of tables
         */
        my.getDataTable = function(x,y){
            
            var dTable = [];
            
            for (var i=y-1; i>=0; i--){
                
                dTable[i] = [];
                
                for (var j=0; j<x; j++){
                    
                    dTable[i][j] = null;
                
                }
            }
            
            return dTable;
        };
        
        /*
         * @return void
         */
        that.init = function(){
        
            my.width = 1 + my.xx - my.yx +
                       my.x * (my.xx + my.yx) + 
                       (my.y - 1) * (my.yx - (my.xx - my.yx));
                       
            my.height = 1 - my.xy +
                        my.y * (my.yy + (my.yy - my.xy)) + 
                        (my.x - 1) * (my.xy + my.yy);

            my.element.style.width = my.width + 'px';
            my.element.style.height = my.height + 'px';
            
            my.setViewPosition(0,0);
            
            my.tileTable = my.getDataTable(my.x,my.y);
            
            //my.points = AP.grid.getCircle(Math.floor(my.x/2),Math.floor(my.x/2),(Math.floor(my.x/2) - 1));
            
            //my.points = AP.grid.getHexCircle(Math.floor(my.x/2),Math.floor(my.x/2),(Math.floor(my.x/2) - 1));
            
            //my.points = AP.grid.getHexCircle(Math.floor(my.x/2),Math.floor(my.x/2),(Math.floor(my.x/2.2) - 1));
            
            my.points = AP.grid.getArea(0,0,my.x-1,my.y-1);
            
            my.pCount = my.points.length;
            for (var k=0; k<my.pCount; k++){
                my.addTile(my.points[k]);
            }
            
            my.gridPosition = aFrame.getElementPosition(my.element);
            
            aFrame.addListener('load',window, that.recalculatePosition);
            aFrame.addListener('resize',window, that.recalculatePosition);
            
            my.mouseEvents.on('down',my.handleMousedown);
            my.mouseEvents.on('move',my.handleMousemove);
            my.mouseEvents.on('up',my.handleMouseup);
            
            aFrame.keyEvents.on('keydown-37',my.handleLeftArrow);
            aFrame.keyEvents.on('keydown-38',my.handleUpArrow);
            aFrame.keyEvents.on('keydown-39',my.handleRightArrow);
            aFrame.keyEvents.on('keydown-40',my.handleDownArrow);

        };
        
        /*
         * @return get tile method
         */
        that.getTile = my.getTile;
        
        /*
         * expose eventscope on method as public method
         * of grid instance.
         *
         * @return void
         */
        that.on = my.events.on;
        
        return that;
    };

    return {
                
        makeGrid : function(p,my){
            return gridInstance(p,my);
        }
    };
    
}());