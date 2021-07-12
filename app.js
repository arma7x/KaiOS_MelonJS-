const MAP_MAP_HEIGHT = 750, HEIGHT = 750;
const VIEWPORT_HEIGHT = 320, VIEWPORT_WIDTH = 240;

var CURRENT_PLAYER = null;
var LOCK_POV = false;

function getRandomInt(min, max) {
  if (min === 0 && max === 1) {
    var y = Math.random();
    if (y < 0.5)
      return 0;
    else
      return 1;
  }
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

function randomID() {
  return '_' + Math.random().toString(36).substr(2, 9);
};

function newGame() {
  CURRENT_PLAYER = me.game.world.addChild(me.pool.pull("human"));
  LOCK_POV = false;
  follow(CURRENT_PLAYER);
}

var game = {
  resources: [
    { name: "map", type: "image", "src": "/map.jpg", },
    { name: "human", type: "image", "src": "/shooter.png", },
  ],
  loaded: function() {
    me.game.world.resize(MAP_MAP_HEIGHT, HEIGHT);
    me.pool.register("human", game.Human);
    me.pool.register("map", game.Map);
    this.playScreen = new game.PlayScreen();
    me.state.set(me.state.PLAY, this.playScreen);
    me.state.change(me.state.PLAY);
  },
  onload: function () {
    if (!me.video.init(VIEWPORT_WIDTH, VIEWPORT_HEIGHT, {
        parent: document.getElementById('playground'),
        scale: "auto",
        renderer: me.video.CANVAS,
        powerPreference: 'high-performance',
        antiAlias: false
      })) {
      alert("Your browser does not support HTML5 Canvas :(");
      return;
    }
    me.loader.preload(game.resources, this.loaded.bind(this));
  },
};

game.PlayScreen = me.Stage.extend({
  onResetEvent: function() {
    me.game.world.addChild(me.pool.pull("map", MAP_MAP_HEIGHT/2, HEIGHT/2))
    me.input.bindKey(me.input.KEY.LEFT, "left");
    me.input.bindKey(me.input.KEY.RIGHT, "right");
    me.input.bindKey(me.input.KEY.UP, "up");
    me.input.bindKey(me.input.KEY.DOWN, "down");
    me.input.bindKey(me.input.KEY.SPACE, "space");
    me.input.bindKey(me.input.KEY.ENTER, "enter");
    
    newGame()
  },
  onDestroyEvent: function() {
    me.input.unbindKey(me.input.KEY.LEFT);
    me.input.unbindKey(me.input.KEY.RIGHT);
    me.input.unbindKey(me.input.KEY.UP);
    me.input.unbindKey(me.input.KEY.DOWN);
    me.input.unbindKey(me.input.KEY.SPACE);
    me.input.unbindKey(me.input.KEY.ENTER);
  }
});

var idleTimer = null;

me.event.subscribe(me.event.KEYDOWN, function (action, keyCode, edge) {
  
});

game.Human = me.Sprite.extend({
  init: function() {
    this._super(me.Sprite, "init", [
      MAP_MAP_HEIGHT / 2 - 20,
      HEIGHT / 2 + 20,
      {
        image: me.loader.getImage("human"),
        framewidth: 27.35,
        frameheight: 41.3333333333
      }
    ]);

    this.addAnimation("idle", [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19], 300);
    this.addAnimation("move", [20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39], 300);
    this.addAnimation("shoot", [40,41,42], 10);
    this.setCurrentAnimation("idle");

    this.__DIRECTION__ = 'down';
    this.vel = 50;
    this.minX = (this.width / 2);
    this.maxX = MAP_MAP_HEIGHT - (this.height / 2);
    this.minY = (this.height / 2);
    this.maxY = HEIGHT - (this.height / 2);

    //this.body = new me.Body(this);
    //// add a default collision shape
    //this.body.addShape(new me.Rect(0, 0, this.width, this.height));
    //// configure max speed and friction
    //this.body.setFriction(0.4, 0);
    //// enable physic collision (off by default for basic me.Renderable)
    //this.isKinematic = false;
    //this.body.setVelocity(0, 0);
    //this.body.setMaxVelocity(0, 0);
    //this.body.collisionType = me.collision.types.PLAYER_OBJECT;

  },
  update: function(time) {
    this._super(me.Sprite, "update", [time]);

    var newX = this.pos.x, newY = this.pos.y;
    const oldX = this.pos.x, oldY = this.pos.y;
    if (me.input.isKeyPressed("left")) {
      if (this.__DIRECTION__ !== 'left' && !LOCK_POV) {
        rotateEntity(this, 'left');
      } else
        newX -= this.vel * time / 1000;
    } else if (me.input.isKeyPressed("right")) {
      if (this.__DIRECTION__ !== 'right' && !LOCK_POV) {
        rotateEntity(this, 'right');
      } else
        newX += this.vel * time / 1000;
    } else if (me.input.isKeyPressed("up")) {
      if (this.__DIRECTION__ !== 'up' && !LOCK_POV) {
        rotateEntity(this, 'up');
      } else
        newY -= this.vel * time / 1000;
    } else if (me.input.isKeyPressed("down")) {
      if (this.__DIRECTION__ !== 'down' && !LOCK_POV) {
        rotateEntity(this, 'down');
      } else
        newY += this.vel * time / 1000;
    }
    if (newX !== oldX || newY !== oldY) {
      if (!this.isCurrentAnimation("move")) {
        this.setCurrentAnimation("move");
      }
      this.pos.x = me.Math.clamp(newX, this.minX, this.maxX);
      this.pos.y = me.Math.clamp(newY, this.minY, this.maxY);
      follow(this);
    }

    return true;
  }
});

game.Map = me.Sprite.extend({
  init: function(x, y) {
    this._super(me.Sprite, "init", [
      x,
      y,
      {
        image: me.loader.getImage('map'),
      }
    ]);
  }
});

function follow(plyr) {
  var mX = plyr.pos.x - (VIEWPORT_WIDTH / 2);
  mX = mX <= (VIEWPORT_WIDTH / 2) ? mX - 1 : mX;
  mX = mX <= 0 ? 0 : mX;
  if ((MAP_MAP_HEIGHT - plyr.pos.x) <= (VIEWPORT_WIDTH / 2)) {
    mX = MAP_MAP_HEIGHT - VIEWPORT_WIDTH
  }
  var mY = plyr.pos.y - (VIEWPORT_HEIGHT / 2);
  mY = mY <= (VIEWPORT_HEIGHT / 2) ? mY - 1 : mY;
  mY = mY <= 0 ? 0 : mY;
  if ((HEIGHT - plyr.pos.y) <= (VIEWPORT_HEIGHT / 2)) {
    mY = HEIGHT - VIEWPORT_HEIGHT
  }
  me.game.viewport.moveTo(mX, mY)
}

function rotateEntity(entity, to) {
  const dirAngle = {up: 0, right: 90, down: 180, left: 270};
  const x = dirAngle[to] - dirAngle[entity.__DIRECTION__];
  entity.__DIRECTION__ = to;
  entity.rotate(x * Math.PI / 180);
}

window.addEventListener("load", function() {

  me.device.onReady(() => {
    game.onload();
  });

  document.addEventListener('keydown', (evt) => {
    me.input.triggerKeyEvent(evt.keyCode, true);
    if ((evt.keyCode === 49 || evt.key === 'Call') && !PLAYING) {
      newGame()
    } else if (evt.key === 'Backspace' || evt.key === 'EndCall') {
      window.close();
    }
  });

  document.addEventListener('keyup', (evt) => {
    me.input.triggerKeyEvent(evt.keyCode, false);
  });

})
