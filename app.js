(function(){

  var TileView = Backbone.View.extend({
    className: 'tile',
    template: _.template("<%- hasMine %>"),

    render: function(){
      this.$el.html(this.template(this.model.toJSON()));
      return this;
    }
  });

  var Game = Backbone.View.extend({
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
    initialize: function(options){
      this.hasMine = options.hasMine;
    }
  });

  var TilesCollection = Backbone.Collection.extend({
    model: TileModel,
  });

  window.game = new Game();
  $('#game').html(window.game.render().el);

})();