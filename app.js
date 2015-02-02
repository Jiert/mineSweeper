(function(){

  var TileView = Backbone.View.extend({
    render: function(){
      this.$el.html('tile: ' + this.model.get('hasMine'));
      return this;
    }
  });

  var Game = Backbone.View.extend({
    initialize: function(){
      _(this).bindAll('renderTiles', 'renderTile', 'render');
      this.tiles = new TilesCollection();

      this.mines = 10;

      for (var i = 0; i < 100; i++){
        var hasMine = this.mines && _.random(1);

        if (hasMine){
          this.mines -= 1;
        }

        var model = new TileModel({
          hasMine: hasMine
        });

        this.tiles.add(model);
      }

      this.renderTiles();
    },

    renderTiles: function(){
      this.tiles.each(this.renderTile);
    },

    renderTile: function(tile){
      var tileView = new TileView({
        model: tile
      });
      this.$el.append(tileView.render().el);
    },

    render: function(){
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