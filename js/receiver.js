window.mediaElement = null;
window.mediaManager = null;

window.onload = function() {
  "use strict";

  // cast receiver initializer
  window.mediaElement = document.getElementById('receiverVideoElement');
  window.mediaManager = new cast.receiver.MediaManager(window.mediaElement);

  cast.receiver.logger.setLevelValue(cast.receiver.LoggerLevel.DEBUG);

  var game = new Game();

  // starting game
  game.start();
};

// Game Class
var Game = function(config) {
  // private
  var that = this,

      defaultConfig = {
        statusText: 'Ready to play',
        maxInactivity: 6000
      },

      appConfig = new cast.receiver.CastReceiverManager.Config();

  // castReceiverManager events

  var events = {
    onSenderConnected: function(event) {
      console.log("### Cast Receiver Manager - Sender Connected : " + JSON.stringify(event));
      // TODO - add sender and grab CastChannel from CastMessageBus.getCastChannel(senderId)
      var senders = that.castReceiverManager.getSenders();
      that.drawPlayers(senders);

      if (senders.length > 1) {
        console.log('### More than 1 player connected! Sending question...');
        that.statusBus.broadcast('ready');
      }
    },
    onSenderDisconnected: function(event) {
      console.log("### Cast Receiver Manager - Sender Disconnected : " + JSON.stringify(event));
      that.drawPlayers(that.castReceiverManager.getSenders());
    }
  };

  // Init
  this.currentQuestion = null;
  this.castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
  _.extend(this.castReceiverManager, events);

  this.statusBus = this.castReceiverManager.getCastMessageBus('urn:x-cast:game.logo.status');
  this.questionsBus = this.castReceiverManager.getCastMessageBus('urn:x-cast:game.logo.questions');

  this.statusBus.onMessage = function(event) {
    console.log('### Message received!', event);

    if(event['data'] === 'start_game') {
      console.log('Starting game! Sending question...');

      // TODO: Should fetch a question from the server/questions stack
      that.currentQuestion = {
        logo: 'img/yahoo.jpg',
        options: ['Yahoo', 'Google', 'Microsoft', 'Amazon'],
        answer: 'Yahoo'
      };

      that.throwQuestion(that.currentQuestion);
    }
  };

  // methods

  this.drawPlayers = function(senders) {
    console.log('### Drawing players', senders);

    var players_list = document.getElementById('connected_players');

    if (players_list) {
      players_list.innerHTML = '';

      for (var i in senders) {
        var li = document.createElement('li');
        li.innerHTML = JSON.stringify(senders[i]);
        players_list.appendChild(li);
      }
    }
  };

  this.throwQuestion = function(q) {
    // print logo
    document.getElementById('logo').src = q.logo;
    // send options to players
    that.sendOptions(q.options);
  };

  this.sendOptions = function(options) {
    that.questionsBus.broadcast(JSON.stringify(options));
  };

  this.start = function() {
    _.extend(appConfig, defaultConfig, config);
    console.log('Starting game with config:', appConfig);
    that.castReceiverManager.start(appConfig);
  };

  return this;
};
