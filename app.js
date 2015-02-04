(function(){

  var TileView = Backbone.View.extend({
    className: 'tile',
    template: _.template("<div class='<%= state %>'><%= hasMine %></div>"),
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
      var index = _(this.model.collection.models).indexOf(this.model),
          count = 0;

      console.log(index);

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
        this.model.set({ state: 'flagged'});
      }
      else if (this.model.get('state') === 'flagged'){
        this.model.set({ state: 'blank'});
      }
    },

    render: function(){
      console.log('tile render', this.model.get('state'));
      this.$el.html(this.template(this.model.toJSON()));
      return this;
    }
  });

  var Game = Backbone.View.extend({
    className: 'board',

    initialize: function(){
      _(this).bindAll('renderTiles', 'renderTile', 'render', 'buildTiles', 'calculateBombs');
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

      // Create bomb count here I think
      this.tiles.each(this.calculateBombs);

      this.tiles.each(this.renderTile);
    },

    calculateBombs: function(model, iteratee){
      // TODO, find better way than splitting with strings
      var divide = (iteratee / 10).toString().split('.'),
          row = parseInt(divide[0]),
          col = parseInt(divide[1]) || 0,
          
          tileInfo = [
            {
              row : row,
              col : col
            }, 
            {
              row : row - 1,
              col : col
            },
            {
              row : row - 1,
              col : col + 1
            },
            {
              row : row,
              col : col + 1
            },
            {
              row : row + 1,
              col : col + 1
            },
            {
              row : row + 1,
              col : col
            },
            {
              row : row + 1,
              col : col - 1
            },
            {
              row : row,
              col : col - 1
            },
            {
              row : row  - 1,
              col : col - 1
            }
          ];

      console.log(tileInfo);

      _(tileInfo).each(function(){

      });

      // _(8).times(function(){});
    },

    renderTile: function(tile){
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
    defaults: {
      'state' : 'blank'
    },
  });

  var TilesCollection = Backbone.Collection.extend({
    model: TileModel,
  });

  window.game = new Game();
  $('#game').html(window.game.render().el);

})();