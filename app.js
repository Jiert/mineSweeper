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
      if (this.model.get('hasMine')){
        // End Game
        this.$el.addClass('mine');
      }

      this.model.set({ 
        state: 'exposed'
      });
    },

    rightClick: function(){
      if (this.model.get('state') === 'blank'){
        this.model.set(
          { state: 'flagged'},
          { silent: true }
        );
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
      }

      return this;
    }
  });

  var Game = Backbone.View.extend({
    className: 'board',

    initialize: function(){
      _(this).bindAll('renderTiles', 'renderTile', 'render', 'buildTiles');
      this.tiles = new TilesCollection();

      this.mines = 10;

      _(100).times(this.buildTiles);

      this.renderTiles();
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
      this.$el.append(tileView.render().el);
    },

    render: function(){
      // renderForm
      // renderTiles
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
      if (model.get('neighborMines') === 0 && !this.get('hasMine')){
        this.set({state: 'exposed'});
      }
    }
  });

  var TilesCollection = Backbone.Collection.extend({
    model: TileModel,
  });

  window.game = new Game();
  $('#game').html(window.game.render().el);

})();