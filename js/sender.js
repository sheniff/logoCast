var APPID = 'B0BB73C1';

window.apiInitialized = false;
window.apiSession = null;
window.showingHud = true;

function setHudMessage(elementId, message) {
  var hud = document.getElementById(elementId);
  if (hud) {
    hud.innerHTML = '' + JSON.stringify(message);
  }
};

// Listeners

var sessionJoinedListener = function(session) {
  setHudMessage('session_established', "Joined " + session.sessionId);
}
var receiverListener = function(availability) {
   setHudMessage('receivers_available', ('available' === availability) ? "Yes" : "No");
}
var onInitSuccess = function() {
  setHudMessage('api_status', "Initialized");
  window.apiInitialized = true;
  connectToGame();
}
var onInitError = function(castError) {
  setHudMessage('api_status', "Initialize Error: " + JSON.stringify(castError));
}
var sessionUpdateListener = function(session) {};

// Channels

var statusListener = function(namespace, message) {
  console.log('Received a status message', message);
  if(message === 'ready') {
    console.log('it is a ready message');
    document.getElementById('playButton').removeAttribute('style');
  }
};

var questionListener = function(namespace, message) {
  console.log('### QUESTION RECEIVED!', namespace, message, JSON.parse(message));
};

// Initializers

function connectToGame() {
  if(window.apiInitialized) {
    chrome.cast.requestSession(
      // Success
      function(session){
        window.apiSession = session;
        session.addUpdateListener(sessionUpdateListener);
        session.addMessageListener('urn:x-cast:game.logo.status', statusListener);
        session.addMessageListener('urn:x-cast:game.logo.questions', questionListener);
        setHudMessage('session_established', "YES - " + session.sessionId);
      },
      // Error
      function(castError){
        setHudMessage('session_established', "ERROR: " + JSON.stringify(castError));
      });
  } else {
    setHudMessage('session_established', "NOT INITIALIZED");
  }
}

function startNewGame() {
  if (!chrome.cast || !chrome.cast.isAvailable) {
    setHudMessage('api_status', "Cast APIs not Available. Retrying...");
    setTimeout(startNewGame, 500);
    return;
  }

  setHudMessage('api_status', "Initializing...");

  var sessionRequest = new chrome.cast.SessionRequest(APPID);

  var apiConfig = new chrome.cast.ApiConfig(sessionRequest,
                      sessionJoinedListener,
                      receiverListener);

  chrome.cast.initialize(apiConfig, onInitSuccess, onInitError);
};

function requestStart() {
  window.apiSession.sendMessage('urn:x-cast:game.logo.status', 'start_game');
};
