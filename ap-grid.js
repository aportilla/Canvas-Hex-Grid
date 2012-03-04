/*
 * Grid
 */
AP.grid = (function(GD){
    
    GD = {};
    
    /*
     * Distance
     * Pythagorean formula for distance between two points A and B
     */
    GD.distance = function(xA,yA,xB,yB){
        return Math.sqrt(Math.pow(Math.abs(xA - xB),2) + Math.pow(Math.abs(yA - yB),2));
    };
    
    /*
     * Hex Distance
     * Pythagorean formula for distance between two HEX points A and B
     * on a hex grid with incrementally increasing x columns.
     */
    GD.hexDistance = function(xA,yA,xB,yB){
        
        var hxA = xA * .866;
        var hyA = yA + xA/2;
        
        var hxB = xB * .866;
        var hyB = yB + xB/2;
    
        return Math.sqrt(Math.pow(Math.abs(hxA - hxB),2) + Math.pow(Math.abs(hyA - hyB),2));
    };
       
    /*
     * Circle
     * @return array of all points within radius distance of a point x,y
     *
     * @note : this can be optimized by looping only through the points
     *         of a quadrant, and transorming them into the other three
     */
    GD.getCircle = function(x,y,radius){

        var result = [],
            i,
            j,
            yMin = y - radius,
            yMax = y + radius,
            xMin = x - radius,
            xMax = x + radius,
            dist;
            
        for (i = yMin; i <= yMax; i++) {
            for (j = xMin; j <= xMax; j++) {
                if (radius >= Math.round(GD.distance(x,y,j,i))){
                    result.push([j,i]);
                }
            }
        }
        
        return result;
    };

    /*
     * Hex Circle
     * @return array of all HEX points within radius distance of a point x,y
     *
     */
    GD.getHexCircle = function(x,y,radius){

        var result = [],
            i,
            j,
            yMin = y - 2 * radius,
            yMax = y + 2 * radius,
            xMin = x - 2 * radius,
            xMax = x + 2 * radius,
            dist;
            
        for (i = yMin; i <= yMax; i++) {
            for (j = xMin; j <= xMax; j++) {
            
                if (radius >= Math.round(GD.hexDistance(x,y,j,i))){
                    result.push([j,i]);
                }
            }
        }
        
        return result;
    };
    
    /*
     * Ring
     * @return array of all points with a distance from point x,y
     *         that rounds to exactly radius.
     */
    GD.getRing = function(x,y,radius){
    
        var result = [],
            i,
            j,
            yMin = y - radius,
            yMax = y + radius,
            xMin = x - radius,
            xMax = x + radius;
            
        for (i = yMin; i <= yMax; i++) {
            for (j = xMin; j <= xMax; j++) {
            
                if (radius - Math.round(GD.distance(x,y,j,i)) === 0){
                    result.push([j,i]);
                }
            }
        }
        
        return result;
    }
    
    /*
     * Diamond
     * @return all points within radius x,y steps from point x,y. 
     */
    GD.getDiamond = function(x,y,radius){
        
        var result = [],
            i,
            j,
            yMin = y - radius,
            yMax = y + radius,
            xOff,
            xMin,
            xMax;
        
        for (i = yMin; i <= yMax; i++) {
            
            xOff = radius - Math.abs(y - i);
            xMin = x - xOff;
            xMax = x + xOff;
            
            for (j = xMin; j <= xMax; j++) {
                result.push([j,i]);
            }
        }
        
        return result;
        
    };
    
    /*
     * Square
     * @return all points within a square with width sideLength and its center
     *         at approx x,y.
     */
    GD.getSquare = function(x,y,sideLength){

        var result = [],
            i,
            j,
            yMin = y - Math.floor(sideLength / 2),
            yMax = yMin + sideLength - 1,
            xMin = x - Math.floor(sideLength / 2),
            xMax = xMin + sideLength - 1;
            
        for (i = yMin; i <= yMax; i++) {
            for (j = xMin; j <= xMax; j++) {
                result.push([j,i]);
            }
        }
        
        return result;
    };
    
    /*
     * Area
     * @return all points within the area defined by a rectangle with
     *         opposite corners A and B.
     */
    GD.getArea = function(xA,yA,xB,yB){
        
        var result = [],
            i,
            j,
            yMin = Math.min(yA,yB),
            yMax = Math.max(yA,yB),
            xMin = Math.min(xA,xB),
            xMax = Math.max(xA,xB);
            
        for (i = yMin; i <= yMax; i++) {
            for (j = xMin; j <= xMax; j++) {
                result.push([j,i]);
            }
        }
        
        return result;
    };
    
    /*
     * Line
     *
     * Calculate the y-intercept of the line, then
     * compare the y-intercepts of the two possible
     * next steps as we move from one end to 
     * the other, and choose the step with the 
     * y-intercept closer the lines true y-intercept.
     * 
     * @return an array of adjacent points
     *         directly between points A and B
     *
     */
    GD.getLine = function(xA,yA,xB,yB){
    
        var result = [[xA,yA]],
            i,
            curX = xA,
            curY = yA,
            xInc = (xA < xB) ? 1 : -1,
            yInc = (yA < yB) ? 1 : -1,
            slope = (yA - yB) / (xA - xB),
            yInt = yA - (slope * xA),
            stepCount = Math.abs(xA - xB) + Math.abs(yA - yB);

        for (i = 0; i < stepCount; i++) {
            
            if (Math.abs(yInt - (curY - slope * (curX + xInc))) < 
                Math.abs(yInt - (curY + yInc - slope * curX))) {
                curX += xInc;
            } else {
                curY += yInc;
            }
            
            result.push([curX,curY]);
        }
        
        return result;
        
    };
    
    /*
     * Hex Line
     *
     * Calculate the y-intercept of the line, then
     * compare the y-intercepts of the two possible
     * next steps as we move from one end to 
     * the other, and choose the step with the 
     * y-intercept closer the lines true y-intercept.
     * 
     * @return an array of adjacent points
     *         directly between points A and B
     *
     */
    GD.getHexLine = function(xA,yA,xB,yB){

        var result = [[xA,yA]],
            hxA = xA * .866,
            hyA = yA + xA/2,
            hxB = xB * .866,
            hyB = yB + xB/2,
            i,
            curX = xA,
            curY = yA,
            slope = (hyA - hyB) / (hxA - hxB),
            yInt = hyA - (slope * hxA),
            xDiff = xB - xA,
            yDiff = yB - yA,
            comboDiff = yDiff + xDiff,
            stepCount = Math.max(Math.abs(xDiff),Math.abs(yDiff),Math.abs(comboDiff)),
            incA,
            incB,
            testPointA,
            testPointB;
        
        if (xA < xB) {
            if (yA < yB) {
                incA = [0,1];
                incB = [1,0];
            } else {
                incA = [1,-1];
                incB = (Math.abs(xDiff) > Math.abs(yDiff)) ? [1,0] : [0,-1];
            } 
        } else {
            if (yA < yB) {
                incA = [-1,1];
                incB = (Math.abs(xDiff) > Math.abs(yDiff)) ? [-1,0] : [0,1];
            } else {
                incA = [-1,0];
                incB = [0,-1];
            }  
        }

        for (i = 0; i < stepCount; i++) {
            
            testPointA = [(.866 * (curX + incA[0])), (curY + incA[1]) + (curX + incA[0]) / 2];
            testPointB = [(.866 * (curX + incB[0])), (curY + incB[1]) + (curX + incB[0]) / 2];
            
            if (Math.abs(yInt - (testPointA[1] - slope * testPointA[0])) < 
                Math.abs(yInt - (testPointB[1] - slope * testPointB[0]))) {
                curX += incA[0];
                curY += incA[1];
            } else {
                curX += incB[0];
                curY += incB[1];
            }
            
            result.push([curX,curY]);
        }

        return result;
        
    };
    
    return GD;
    
}());