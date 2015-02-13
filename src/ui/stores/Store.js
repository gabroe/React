var CHANGE_EVENT = "change",
    Store = _.extend(Backbone.Model.extend({
        emitChange : function(){
            this.trigger(CHANGE_EVENT);
        },

        addChangeListener : function(callback){
            this.on(CHANGE_EVENT, callback, this);
        },

        removeChangeListener : function(callback){
            this.off(CHANGE_EVENT, callback);
        }

    }, Backbone.Events));

module.exports = Store;