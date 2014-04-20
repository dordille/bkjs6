window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;


// Demo 1
function camSuccess(localMediaStream) {
  var video = document.getElementById('video1');
  video.src = window.URL.createObjectURL(localMediaStream);
}
function camFailure() {
  alert('Failure');
}
document.getElementById('button1').onclick = function() {
  navigator.webkitGetUserMedia({video: true, audio: false}, camSuccess, camFailure);
}


function demo_2() {

  var server = {
    offerDef: $.Deferred(),
    answerDef: $.Deferred(),
    sendOffer: function(offer) {
      this.offer = offer;
      this.offerDef.resolve(offer);
    },
    getOffer: function(fn) {
      this.offerDef.promise().done(fn);
    },
    sendAnswer: function(answer) {
      this.answer = answer;
      this.answerDef.resolve(answer);
    },
    getAnswer: function(fn) {
      this.answerDef.promise().done(fn);
    }
  }

  // Factory function for onaddstream
  function onaddstream(elementId) {
    return function(object) {
      // Create video element
      var video = document.createElement("video");
      video.autoplay = true;
      // Create object URL from stream source
      video.src = window.URL.createObjectURL(object.stream);

      // Find element and append video stream
      var element = document.getElementById(elementId);
      element.appendChild(video);
    }
  }

  // Create RTCPeerConnection for caller and answerer
  var cpc = new RTCPeerConnection(null);
  cpc.onaddstream = onaddstream("callee");

  // When client peer connection gets an icecandidate forward candidate to answeree
  // This would normally be done by forwarding candidate details to server which would
  // that in turn woruld foward details other clients
  cpc.onicecandidate = function(event) {
    if (event.candidate) {
      apc.addIceCandidate(new RTCIceCandidate(event.candidate));
    }
  }

  var apc = new RTCPeerConnection(null);
  apc.onaddstream = onaddstream("answeree");

  apc.onicecandidate = function(event) {
    if (event.candidate) {
      cpc.addIceCandidate(new RTCIceCandidate(event.candidate));
    }
  }

  // Get video stream
  navigator.getUserMedia({video: true}, function(stream) {

    // As soon as stream is available add it to the peer connection, this needs to be done
    // before the calling and answering process, order is important
    cpc.addStream(stream);
    // Invoke the onaddstream method for the client's own stream, this is just so we don't have
    // to write two separate methods to handle appending video for the caller's own video stream
    // and the video stream or its peers
    cpc.onaddstream({stream: stream});
  
    // See comment above
    apc.onaddstream({stream: stream});
    apc.addStream(stream);

  });

  function call() {
    // Have caller create an offer and forward it to server
    cpc.createOffer(function(offer) {
      cpc.setLocalDescription(new RTCSessionDescription(offer), function() {
        console.log("[Callee] Sending offer: ", offer);
        server.sendOffer(offer);
      });
    });

    // Wait for the server to respond with a peer's answer
    server.getAnswer(function(answer) {
      console.log('[Callee] Recieved answer:', answer);
      cpc.setRemoteDescription(new RTCSessionDescription(answer)); 
    });

    // Have answerer wait for server to forward an offer, once an offer has been recieved
    // create an answer and forward it to the server to be sent back to the client initiating
    // the offer
    server.getOffer(function(offer) {
      console.log('[Answeree] Recieved offer:', offer);
      apc.setRemoteDescription(new RTCSessionDescription(offer), function() {
        apc.createAnswer(function(answer) {
          apc.setLocalDescription(new RTCSessionDescription(answer), function() {
            console.log('[Answeree] Sending answer:', answer);
            server.sendAnswer(answer);
          });
        });
      });
    });

  }
  document.getElementById('call').onclick = call;


  var gif = new GIF({
    workers: 2,
    quality: 10,
    workerScript: 'scripts/gif.worker.js'
  });

  document.getElementById('capture-streams').onclick = function() {
    var canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 300;
    var ctx = canvas.getContext('2d');
    var callee = document.getElementById("callee");
    ctx.drawImage(callee.children[0], 0, 0, 300, 300);
    ctx.drawImage(callee.children[1], 300, 0, 300, 300);
    gif.addFrame(canvas, {delay: 200});
  }

  document.getElementById('make-gif').onclick = function() {
    gif.on('finished', function(blob) {
      window.open(URL.createObjectURL(blob));
    });

    gif.render();
  }
}

document.getElementById('init').onclick = demo_2;



// Demo 3
document.getElementById('start-capture').onclick = function() {
  var video = document.getElementById('video-capture');
  function camSuccess(localMediaStream) {
    video.src = window.URL.createObjectURL(localMediaStream);
  }
  function camFailure() {
    alert('Failure');
  }
  navigator.webkitGetUserMedia({video: true, audio: false}, camSuccess, camFailure);

  var canvas = document.getElementById('canvas-capture');
  var ctx = canvas.getContext("2d");

  document.getElementById('button-capture').onclick = function() {
    ctx.drawImage(video, 0, 0, 300, 200);
  }
}






