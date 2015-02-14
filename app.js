(function(){

  var TileView = Backbone.View.extend({
    className: 'tile',
    template: _.template("<div class='<%= state %>'><span><%= neighborMines %></span></div>"),
    colors: ['white', 'blue', 'green', 'red', 'navy', 'maroon', 'aqua', 'black', 'lightgray'],
    events: {
      'mousedown' : 'onTileClick'
    },

    initialize: function(){
      _(this).bindAll('leftClick', 'rightClick');
      this.listenTo(this.model, 'change', this.render);
    },

    onTileClick: function(event){
      switch (event.which) {
        case 1:
          this.leftClick();
          break;
        case 3:
          this.rightClick();
          break;
        default: return;
      }
    },

    leftClick: function(){
      this.model.collection.trigger('start');
      if (this.model.get('state') === 'flagged') return;
      if (this.model.get('hasMine')){
        this.model.collection.exposeAllMines();
      }
      this.model.set({ 
        state: 'exposed'
      });
    },

    rightClick: function(){
      this.model.collection.trigger('start');
      if (this.model.get('state') === 'blank'){
        this.model.set({ state: 'flagged' });
        this.render();
      }
      else if (this.model.get('state') === 'flagged'){
        this.model.set({ state: 'blank'});
      }
    },

    render: function(){
      var neighborMines = this.model.get('neighborMines') === 0 ? '' : this.model.get('neighborMines');
      var data = {
        state: this.model.get('state'),
        neighborMines: this.model.get('state') === 'exposed' ? neighborMines : '' 
      };

      this.$el.html(this.template(data));

      if (this.model.get('state') === 'exposed'){
        this.$('span').addClass(this.colors[neighborMines]);
        if (this.model.get('hasMine')){
          this.$el.addClass('mine'); 
        }
      }
      return this;
    }
  });

  var Game = Backbone.View.extend({
    events: {
      'click .restart' : 'startGame'
    },

    className: 'board',

    template: _.template("\
      <div class='counter'></div>\
      <button class='restart'>:-)</button>\
      <div class='timer'></div>\
      <div class='tiles'></div>"
    ),

    initialize: function(){
      _(this).bindAll('renderTiles', 'renderTile', 'render', 'buildTiles');
      this.tiles = new TilesCollection();
      this.startGame()
    },

    startGame: function(){
      this.cleanup();
      _(100).times(this.buildTiles);
      this.render();
    },

    cleanup: function(){
      if (this.subViews && this.subViews.length){
        _(this.subViews).each(function(subView){
          subView.remove();
        });
      }
      this.subViews = [];
      this.mines = 10;
      this.tiles.reset();
      this.$el.html('');
    },

    buildTiles: function(i){
      var model = new TileModel({
        hasMine: this.mines < 1 ? false : true
      });

      this.tiles.add(model);

      this.mines -= 1;
    },

    renderTiles: function(){
      this.tiles.reset(this.tiles.shuffle());
      this.tiles.each(this.renderTile);
    },

    renderTile: function(tile, iteratee){
      tile.getRelations(tile, iteratee);

      var tileView = new TileView({
        model: tile
      });

      this.subViews.push(tileView);
      this.$tiles.append(tileView.render().el);
    },

    renderCounter: function(){
      this.counterView = new CounterView({
        tiles: this.tiles
      });

      this.subViews.push(this.counterView);
      this.$counter.html(this.counterView.render().el);
    },

    renderTimer: function(){
      this.timerView = new TimerView({
        tiles: this.tiles
      });

      this.subViews.push(this.timerView);
      this.$timer.html(this.timerView.el);
    },

    render: function(){
      this.$el.html(this.template());

      this.$tiles   = this.$('.tiles');
      this.$timer   = this.$('.timer');
      this.$counter = this.$('.counter');

      this.renderTiles();
      this.renderCounter();
      this.renderTimer();

      return this;
    }
  });

  var CounterView = Backbone.View.extend({
    initialize: function(options){
      _(this).bindAll('render', 'updateCount', 'checkWin');

      this.tiles = options.tiles
      this.mines = this.tiles.where({ hasMine: true });
      this.blanks = this.tiles.where({ hasMine: false });

      this.listenTo(this.tiles, {
        'change': this.render
      })
      this.totalMines = this.tiles.where({'hasMine':true}).length;
      this.count = this.totalMines;
    },

    updateCount: function(tile){
      if (tile && tile.get('state') === 'flagged'){
        -- this.count;
      }
      else if (tile && tile.get('state') === 'blank'){
        ++ this.count;
      }
    },
    
    every: function(modelsArray, key, value){
      for (var i = 0; i < modelsArray.length; i++){
        if (modelsArray[i].get(key) !== value) return false;
      }
      return true;
    },

    checkWin: function(){
      // Win means all tiles with mines are flagged and
      // all other tiles w/o mines are exposed
      // var allMinesFlagged = this.mines.every({ attributes: 'flagged' })
      var allMinesFlagged = this.every(this.mines, 'state', 'flagged'),
          allBlanksExposed = this.every(this.blanks, 'state', 'exposed');

      if (allMinesFlagged && allBlanksExposed){

        // should name this trigger something different
        this.tiles.trigger('expose:allMines');
        alert('You fuckin win!')
      }
    },

    render: function(tile){
      this.updateCount(tile);
      this.checkWin();
      
      this.$el.html(this.count);

      return this;
    }
  }); 

  var TimerView = Backbone.View.extend({
    initialize: function(options){
      _(this).bindAll('render');

      this.counter = 0;

      this.tiles  = options.tiles;
      this.listenTo( this.tiles, {
        'start': _.once(this.onStart),
        'expose:allMines' : this.onStopTimer
      });

      this.render();
    },

    onStopTimer: function(){
      clearInterval(this.interval);
    },

    onStart: function(){
      this.interval = setInterval(this.render, 1000)
    },

    render: function(){
      this.$el.html(this.counter.toString());
      this.counter ++;
      return this;
    }
  });

  var TileModel = Backbone.Model.extend({
    initialize: function(){
      _(this).bindAll('getRelations','getRelation');
      this.relatedModelsCollection = new Backbone.Collection();
    },

    relations: [[-1, 0], [-1,+1], [0,+1], [+1,+1], [+1,0], [+1,-1], [0,-1], [-1,-1]],
    defaults: {
      'state'         : 'blank',
      'neighborMines' : 0
    },
    
    getRelations: function(tile, iteratee){
      var divide = (iteratee / 10).toString().split('.');

      this.location = [
        parseInt(divide[0]),
        parseInt(divide[1]) || 0
      ];

      _(this.relations).each(this.getRelation, this);

      this.listenTo(this.relatedModelsCollection, 'change', this.onRelationChange);
    },

    getRelation: function(relation, index){
      var x = this.location[0] + relation[0],
          y = this.location[1] + relation[1],
          neighborMines = this.get('neighborMines'),
          modelIndex,
          model;

      if (x < 0 || x > 9) return;
      if (y < 0 || y > 9) return;

      modelIndex = parseInt('' + x + y);
      model = this.collection.at(modelIndex);

      if (model.get('hasMine')){
        this.set(
          { neighborMines: ++neighborMines },
          { silent: true }
        );
      }

      this.relatedModelsCollection.add(this.collection.at(modelIndex));
    },

    onRelationChange: function(model){
      if (model.get('hasMine')) return;
      
      // ask if the changed related model has any neighbor mines
      // if they don't, it's safe to expose this tile.
      if (model.get('neighborMines') === 0 && !this.get('hasMine')){
        this.set({state: 'exposed'});
      }
    }
  });

  var TilesCollection = Backbone.Collection.extend({
    model: TileModel,
    exposeAllMines: function(){
      this.each(function(model){
        if (model.get('hasMine')){ 
          model.set({ state: 'exposed' }); 
        }
      });
      this.trigger('expose:allMines');
    }
  });

  window.game = new Game();
  $('#game').html(window.game.el);

})();