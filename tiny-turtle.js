// tiny-turtle.js
// 2013-10-11
// Public Domain.
// For more information, see http://github.com/toolness/tiny-turtle.

function TinyTurtle(canvas) {
  canvas = canvas || document.querySelector('canvas');

  var self = this;
  var rotation = 90;
  var position = {
    // See http://diveintohtml5.info/canvas.html#pixel-madness for
    // details on why we're offsetting by 0.5.
    x: canvas.width / 2 + 0.5,
    y: canvas.height / 2 + 0.5
  };
  var isPenDown = true;
  var queue = []
  var processingQueue = false
  var radians = function(r) {return 2 * Math.PI * (r / 360) };
  var triangle = function(ctx, base, height) {
    ctx.beginPath(); ctx.moveTo(0, -base / 2); ctx.lineTo(height, 0);
    ctx.lineTo(0, base / 2); ctx.closePath();
  };

  function enqueue(action, argument) {
    queue.push([action, argument])
    if (!processingQueue) next()
  }

  function next() {
    if (queue.length === 0) {
      processingQueue = false
      return
    }
    processingQueue = true
    var upNext = queue.shift()
    upNext[0](upNext[1])
  }

  function draw(ctx, x0, y0, x1, y1) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }

  function animateDraws(ctx, index, points, dt, done) {
    if (index >= points.length - 1) return done()
    var startPoint = points[index]
    var nextPoint = points[index + 1]
    draw(ctx, startPoint.x, startPoint.y, nextPoint.x, nextPoint.y)
    setTimeout(function() {
      animateDraws(ctx, index + 1, points, dt, done)
    }, dt)
  }

  function moveForward(distance) {
    var origX = position.x, origY = position.y;
    position.x += Math.cos(radians(rotation)) * distance;
    position.y -= Math.sin(radians(rotation)) * distance;
    if (!isPenDown) return;

    var numFrames = (self.animationDuration / 1000 * 20) // 20fps
    var dt = self.animationDuration / numFrames

    var points = []
    var dx = (position.x - origX) / numFrames
    var dy = (position.y - origY) / numFrames

    for (var i = 0; i <= numFrames; i++) {
      var point = {}
      point.x = origX + dx * i
      point.y = origY + dy * i
      points.push(point)
    }

    var ctx = canvas.getContext('2d');
    ctx.strokeStyle = self.penStyle;
    ctx.lineWidth = self.penWidth;

    animateDraws(ctx, 0, points, dt, next)
  }

  function rotate(deg) {
    rotation = (rotation + deg) % 360;
    if (rotation < 0) rotation += 360;
    next()
  };

  function drawStamp(size) {
    var ctx = canvas.getContext('2d');
    ctx.save();
    ctx.strokeStyle = ctx.fillStyle = self.penStyle;
    ctx.lineWidth = self.penWidth;
    ctx.translate(position.x, position.y);
    ctx.rotate(-radians(rotation));
    triangle(ctx, size || 10, (size || 10) * 1.5);
    isPenDown ? ctx.fill() : ctx.stroke();
    ctx.restore();
    next()
  }

  self.penStyle = 'black';
  self.penWidth = 1;
  self.animationDuration = 600;

  self.penUp = function() { isPenDown = false; return self; };
  self.penDown = function() { isPenDown = true; return self; };

  self.forward = self.fd = function(distance) {
    enqueue(moveForward, distance)
    return self
  };

  self.stamp = function(size) {
    enqueue(drawStamp, size)
    return self
  };

  self.left = self.lt = function(deg) {
    enqueue(rotate, deg)
    return self
  };
  self.right = self.rt = function(deg) {
    enqueue(rotate, -deg)
    return self
  };

  Object.defineProperties(self, {
    canvas: {get: function() { return canvas; }},
    rotation: {get: function() { return rotation; }},
    position: {get: function() { return {x: position.x, y: position.y}; }},
    pen: {get: function() { return isPenDown ? 'down' : 'up'; }}
  });

  return self;
}
