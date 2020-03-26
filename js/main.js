
var video;
var videoContainer = document.querySelector('.videoContainerCam');
var buttonChange; 
var buttonFullscreen;
var recordButton;
var controls = document.querySelector('.controls');
var videos = document.querySelectorAll('.videoElement');
var amountOfCameras = 0;
var currentFacingMode = 'user';

document.addEventListener('DOMContentLoaded', function(event) {
  // do some WebRTC checks before creating the interface
  DetectRTC.load(function() {
    // do some checks
    if (DetectRTC.isWebRTCSupported == false) {
      alert(
        'Please use Chrome, Firefox, iOS 11, Android 5 or higher, Safari 11 or higher',
      );
    } else {
      if (DetectRTC.hasWebcam == false) {
        alert('Please install an external webcam device.');
      } else {
        amountOfCameras = DetectRTC.videoInputDevices.length;

        initCameraUI();
        initCameraStream();
      }
    }

    console.log(
      'RTC Debug info: ' +
        '\n OS:                   ' +
        DetectRTC.osName +
        ' ' +
        DetectRTC.osVersion +
        '\n browser:              ' +
        DetectRTC.browser.fullVersion +
        ' ' +
        DetectRTC.browser.name +
        '\n is Mobile Device:     ' +
        DetectRTC.isMobileDevice +
        '\n has webcam:           ' +
        DetectRTC.hasWebcam +
        '\n has permission:       ' +
        DetectRTC.isWebsiteHasWebcamPermission +
        '\n getUserMedia Support: ' +
        DetectRTC.isGetUserMediaSupported +
        '\n isWebRTC Supported:   ' +
        DetectRTC.isWebRTCSupported +
        '\n WebAudio Supported:   ' +
        DetectRTC.isAudioContextSupported +
        '\n is Mobile Device:     ' +
        DetectRTC.isMobileDevice,
    );
  });
});

function initCameraUI() {
  video = document.querySelector('#videoCam');

  recordButton = document.querySelector('.buttonRecord');
  toggleFullScreenButton = document.querySelector('.buttonFullscreen');
  switchCameraButton = document.querySelector('.buttonChange');

  //Fullscreen
  function fullScreenChange() {
    if (screenfull.isFullscreen) {
      toggleFullScreenButton.setAttribute('aria-pressed', true);
    } else {
      toggleFullScreenButton.setAttribute('aria-pressed', false);
    }
  }

  if (screenfull.isEnabled) {
    screenfull.on('change', fullScreenChange);

    toggleFullScreenButton.style.display = 'block';

    // set init values
    fullScreenChange();

    toggleFullScreenButton.addEventListener('click', function() {
      screenfull.toggle(document.getElementById('container')).then(function() {
        console.log(
          'Fullscreen mode: ' +
            (screenfull.isFullscreen ? 'enabled' : 'disabled'),
        );
      });
    });
  } else {
    console.log("iOS doesn't support fullscreen (yet)");
  }

  //Switch Cameras 
  if (amountOfCameras > 1) {
    switchCameraButton.style.display = 'block';

    switchCameraButton.addEventListener('click', function() {
      if (currentFacingMode === 'environment') currentFacingMode = 'user';
      else currentFacingMode = 'environment';

      initCameraStream();
    });
  }
}

function initCameraStream() {
  //Stop any active streams in the window
  if (window.stream) {
    window.stream.getTracks().forEach(track => track.stop())
  }

  //Stream Resolution
  var sizeW = 1080;
  var sizeH = 640;

  var constraints = {
    audio: false,
    video: {
      width: { ideal: sizeW },
      height: { ideal: sizeH },
      //width: { min: 1024, ideal: window.innerWidth, max: 1920 },
      //height: { min: 776, ideal: window.innerHeight, max: 1080 },
      facingMode: currentFacingMode,
    },
  };

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(handleSuccess)
    .catch(handleError);

  function handleSuccess(stream) {
    window.stream = stream; // make stream available to browser console
    video.srcObject = stream;

    if (constraints.video.facingMode) {
      if (constraints.video.facingMode === 'environment') {
        switchCameraButton.setAttribute('aria-pressed', true);
      } else {
        switchCameraButton.setAttribute('aria-pressed', false);
      }
    }

    const track = window.stream.getVideoTracks()[0];
    const settings = track.getSettings();
    str = JSON.stringify(settings, null, 4);
    console.log('settings ' + str);

    //return navigator.mediaDevices.enumerateDevices();
  }

  //Show Permission Message if permission is denied
  function handleError(err) {
    console.log(err);

    if (err.name == "NotFoundError" || err.name == "DevicesNotFoundError") {
      //required track is missing 
    } else if (err.name == "NotReadableError" || err.name == "TrackStartError") {
      //webcam or mic are already in use 
      //alert('Webcam or mic already in use');
    } else if (err.name == "OverconstrainedError" || err.name == "ConstraintNotSatisfiedError") {
      //constraints can not be satisfied by avb. devices 
    } else if (err.name == "NotAllowedError" || err.name == "PermissionDeniedError") {
      //permission denied in browser
      alert('Permission denied. Please refresh and give permission.');
    } else if (err.name == "TypeError" || err.name == "TypeError") {
      //empty constraints object 
    } else {
      //other errors 
    }
  }
}

//Change Webcam Position 
for (let i = 0; i < videos.length; i++) {
  videos[i].addEventListener("dblclick", function(constraints) {
    console.log(this.dataset.index);

    if (this.dataset.index == 1) {
      videoContainer.style.top = "5%";
    }

    if (this.dataset.index == 2) {
      videoContainer.style.top = "35%";
    }

    if (this.dataset.index == 3) {
      videoContainer.style.top = "65%";
    }
  });
}

//Change Videos
var videoElement1 = document.querySelector("#videoElement1");
var videoElement2 = document.querySelector("#videoElement2");
var videoElement3 = document.querySelector("#videoElement3");
var randomVideo1 = [13, 23, 33, 43];
var randomVideo2 = [12, 22, 32, 42];
var randomVideo3 = [11, 21, 31, 41];

videoElement1.addEventListener("click", function(){
  this.src = `img/videos/MPS${randomVideo1[Math.floor(Math.random()*randomVideo1.length)]}.mp4`; 
});

videoElement2.addEventListener("click", function(){
  this.src = `img/videos/MPS${randomVideo2[Math.floor(Math.random()*randomVideo2.length)]}.mp4`; 
});

videoElement3.addEventListener("click", function(){
  this.src = `img/videos/MPS${randomVideo3[Math.floor(Math.random()*randomVideo3.length)]}.mp4`; 
});

//Icons
feather.replace()

//
//Recording
//
let preview = document.getElementById("videoCam");
let recording = document.getElementById("recording");
let startButton = document.getElementById("startButton");
let downloadButton = document.getElementById("downloadButton");
let logElement = document.getElementById("log");

//Recording Time of the Video
let recordingTimeMS = 4000;

//Log information for the user
function log(msg) {
  logElement.innerHTML += msg + "\n";
}

function wait(delayInMS) {
  return new Promise(resolve => setTimeout(resolve, delayInMS));
}

//Starting the recording process
function startRecording(stream, lengthInMS) {
  //Create new MediaRecorder, which handles recording the input stream
  let recorder = new MediaRecorder(stream);
  //Create empty array for Blobs of media data from the ondataavailable event handler
  let data = [];

  //Event handler pushes Blob onto the data array (once data is available)
  recorder.ondataavailable = event => data.push(event.data);
  //Starts recording
  recorder.start();
  log(recorder.state + " for " + (lengthInMS/1000) + " seconds...");

  //New Promise, resolves when Media Recorder is stopped
  let stopped = new Promise((resolve, reject) => {
    recorder.onstop = resolve;
    recorder.onerror = event => reject(event.name);
  });

  //New Promise, resolves when specified number of milliseconds have elapsed and stops Media Recorder
  let recorded = wait(lengthInMS).then(
    () => recorder.state == "recording" && recorder.stop()
  );

  //New Promise, resolves when both promises (stopped and recorded) have resolved. The Array data is then returned by startRecording() to its caller
  return Promise.all([
    stopped,
    recorded
  ])
  .then(() => data);
}

//Stops the input media
function stop(stream) {
  stream.getTracks().forEach(track => track.stop());
}

//Getting an input stream and setting up the recorder
startButton.addEventListener("click", function() {
  //New MediaStream is requested which gets recorded later
  navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      width: { ideal: 1080 },
      height: { ideal: 640 },
      //width: { min: 1024, ideal: window.innerWidth, max: 1920 },
      //height: { min: 776, ideal: window.innerHeight, max: 1080 },
      facingMode: currentFacingMode,
    } 
  //srcObject set to stream, download button link reffers to stream, polyfills for moz, New Promise which resolves when preview video starts to play 
  }).then(stream => {
    preview.srcObject = stream;
    downloadButton.href = stream;
    preview.captureStream = preview.captureStream || preview.mozCaptureStream;
    return new Promise(resolve => preview.onplaying = resolve);
  //When video begins to play startRecording() is called
  }).then(() => startRecording(preview.captureStream(), recordingTimeMS))
  //The array of recorded media data Blobs (recordedChunks) are merged into a single Blob with MIME type "video/webm". 
  .then (recordedChunks => {
    let recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
    //URL that references the Blob is created and assigned to the recorded video and the download button
    recording.src = URL.createObjectURL(recordedBlob);  
    downloadButton.href = recording.src;
    downloadButton.download = "mixmatch.mp4";

    //Size and Type of the recorded Media is logged
    log("Successfully recorded " + recordedBlob.size + " bytes of " + recordedBlob.type + " media.");
  })
  .catch(log);
}, false);

//Calls the stop() function
/*
stopButton.addEventListener("click", function() {
stop(preview.srcObject);
}, false);
*/
