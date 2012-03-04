var Tile = function(){

    var hex = function(ctx,a,b,c,d,color,width){
        ctx.fillStyle = color || 'coral';  
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = width || 1;
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
    
    var line = function(ctx,fx,fy,tx,ty,color,width){
        ctx.strokeStyle = color || 'black';
        ctx.lineWidth = width || 1;
        ctx.beginPath();
        ctx.moveTo(fx,fy);
        ctx.lineTo(tx,ty);
        ctx.closePath();
        ctx.stroke();
    };

    return function(yx,yy,xx,xy,p,my){
    
        var that = {};
        p  = p  || {};
        my = my || {};
        yx = yx || 25;
        yy = yy || 20;
        xx = xx || 40;
        xy = xy || 5;
        
        my.el = document.createElement('canvas');
        my.el.width = 2 * xx + 1;
        my.el.height = 2 * yy + 2 * xy + 1;
        my.el.className = p.className || 'tile';
        my.context = my.el.getContext('2d');
        my.context.translate(.5,.5);
        
        hex(my.context,yx,yy,xx,xy,'#333');
        
        console.log(position());
        
        that.left = function(l){
            my.el.style.left = l + 'px';
            return that;
        };
        
        that.bottom = function(b){
            my.el.style.bottom = b + 'px';
            return that;
        };
        
        that.setHover = function(bool){
            my.context.clearRect ( 0 , 0 , my.el.width , my.el.height );
            hex(my.context,yx,yy,xx,xy,(bool ? '#456' : '#333'));
        };
        
        that.into = function(parent){
            parent.appendChild(my.el);
            return that;
        };
          
        return that;
    };
    
}();