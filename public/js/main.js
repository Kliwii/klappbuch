
let videoContainer = document.querySelector('.videoContainerCam'); 
let video = document.querySelector('#videoCam');
let toggleFullScreenButton = document.querySelector('.buttonFullscreen');
let switchCameraButton = document.querySelector('.buttonChange');
let controls = document.querySelector('.controls');
let videos = document.querySelectorAll('.videoElement');
let muteVideoButton = document.querySelectorAll('.muteVideo');
let videoButtonRight = document.querySelectorAll('.videoButtonRight');
let videoButtonLeft = document.querySelectorAll('.videoButtonLeft');
let amountOfCameras = 0;
let currentFacingMode = 'user';
let canvas = document.getElementById('videoCanvas');
let canvasContext = canvas.getContext("2d");
let videoContainerOutput = document.querySelector('.videoContainerOutput'); 
let videoOutput = document.getElementById('videoOutput');
let videoContainerRecording = document.querySelector('.videoContainerRecording'); 
let recording = document.getElementById("recording");
let showLiveVideoButton = document.getElementById("showLiveVideo");
let startButton = document.getElementById("startButton");
let downloadButton = document.getElementById("downloadButton");
let uploadVideoNotice = document.getElementById("uploadVideoNotice");
let uploadVideo = document.getElementById("uploadVideo");
let uploadNotice = document.getElementById("uploadNotice");
let uploadNoticeClose = document.getElementById("uploadNoticeClose");
let uploadNoticeCancel = document.getElementById("uploadNoticeCancel");
let uploadBar = document.getElementById("uploadBar");
let recordStatus = document.getElementById("recordStatus");
//let logElement = document.getElementById("log");
let audioStream;
let webcamPosition;
window.webcamPosition = 1;

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
        alert('Please install an external webcam device!');
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
        DetectRTC.isAudioContextSupported,
    );
  });
});

function initCameraUI() {
  //
  //Fullscreen
  //
  function fullScreenChange() {
    if (screenfull.isFullscreen) {
      toggleFullScreenButton.setAttribute('aria-pressed', true);
    } else {
      toggleFullScreenButton.setAttribute('aria-pressed', false);
    }
  }

  if (screenfull.isEnabled) {
    screenfull.on('change', fullScreenChange);

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

  //
  //Switch Cameras 
  //
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
    audio: true,
    video: {
      width: { min: sizeW, max: sizeW },
      height: { min: sizeH, max: sizeH },
      aspectRatio : { ideal: 1.6875 },
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

    //Init Canvas for resizing and effects
    video.addEventListener("playing", initCanvas);

    if (constraints.video.facingMode) {
      if (constraints.video.facingMode === 'environment') {
        switchCameraButton.setAttribute('aria-pressed', true);
      } else {
        switchCameraButton.setAttribute('aria-pressed', false);
      }
    }

    //Logging Video Track Data to console
    const track = window.stream.getVideoTracks()[0];
    const settings = track.getSettings();
    str = JSON.stringify(settings, null, 4);
    console.log('settings ' + str);

    return navigator.mediaDevices.enumerateDevices();
  }

  //Show Permission Message if permission is denied
  function handleError(err) {
    console.log(err);

    if (err.name == "NotFoundError" || err.name == "DevicesNotFoundError") {
      //required track is missing 
    } else if (err.name == "NotReadableError" || err.name == "TrackStartError") {
      //webcam or mic are already in use 
      alert('Webcam or mic already in use');
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

//
//Canvas
//
function initCanvas() {

  let hRatio = (canvas.width / video.videoWidth) * video.videoHeight;
  //Flip the Canvas
  //canvasContext.translate(canvas.width, 0); 
  //canvasContext.scale(-1, 1);
  drawToCanvas();

  function drawToCanvas() {
    //draw video to canvas
    canvasContext.drawImage( video, 0, 0, canvas.width, hRatio );

    requestAnimationFrame( drawToCanvas );
  }
  
  let canvasStream = canvas.captureStream();

  //Add audio to canvasStream
  initAudioStream(canvasStream);
}

function initAudioStream(canvasStream) {

  var audioCtx = new AudioContext();
  // create a stream from our AudioContext
  var dest = audioCtx.createMediaStreamDestination();
  aStream = dest.stream;
  // connect our video element's output to the stream
  var sourceNode = audioCtx.createMediaElementSource(video);
  sourceNode.connect(dest)

  // output to our headphones
  sourceNode.connect(audioCtx.destination)

  canvasStream.addTrack(aStream.getAudioTracks()[0]);
  var mixedStream = 'MediaStream' in window ? new MediaStream([canvasStream.getVideoTracks()[0], aStream.getAudioTracks()[0]]) : canvasStream;

  window.mixedStream = mixedStream; //make mixedStream available to browser console
  videoOutput.srcObject = mixedStream;
};

//
//Recording
//

//Recording Time of the Video
let recordingTimeMS = 4000;

//Log information for the user
function log(msg) {
  logElement.innerHTML += msg + "\n";
}

function wait(delayInMS) {
  return new Promise(resolve => setTimeout(resolve, delayInMS));
}

startButton.addEventListener("click", startRecordingProcess);
function startRecordingProcess() {
  startButton.className += " active";
  videoContainerRecording.style.zIndex = "5";
  //Remove Event Listener until video recorded
  startButton.removeEventListener("click", startRecordingProcess);

  startTimer();
};

//Recording Countdown
let timerDisplay = document.getElementById("recordTimer");

function startTimer() {
  let timeleft = 3;
  timerDisplay.innerHTML = 4;
  let recordTimer = setInterval(function(){
    if(timeleft <= 0){
      clearInterval(recordTimer);
      timerDisplay.innerHTML = "";
      startRecording(mixedStream, recordingTimeMS);
    } else {
      timerDisplay.innerHTML = timeleft;
    }
    timeleft -= 1;
  }, 1000);
};

function startRecording(stream, lengthInMS) {
  recordStatus.style.display = "block";
  recordStatus.style.opacity = "1";
  //Create new MediaRecorder, which handles recording the input stream
  let options = { mimeType: 'video/webm' };
  let recorder = new MediaRecorder(stream, options);
  //Create empty array for Blobs of media data from the ondataavailable event handler
  let data = [];

  //Event handler pushes Blob onto the data array (once data is available)
  recorder.ondataavailable = event => data.push(event.data);
  //Starts recording
  recorder.start();
  console.log(recorder.state + " for " + (lengthInMS/1000) + " seconds...");

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
  .then(() => handleRecordingData(data));
}

function handleRecordingData(recordedChunks) {
  recordStatus.style.display = "none";
  recordStatus.style.opacity = "0";
  
  let recordedBlob = new Blob(recordedChunks, { type: "video/mp4" });
  //URL that references the Blob is created and assigned to the recorded video and the download button
  recording.src = URL.createObjectURL(recordedBlob);  
  //downloadButton.href = recording.src;
  //downloadButton.download = "mixmatch.mp4";
  videoContainerRecording.style.zIndex = "15";
  startButton.classList.remove("active");

  //Adding Event Listener again, after Recording is complete
  startButton.addEventListener("click", startRecordingProcess);

  uploadVideo.addEventListener("click", function() {
    uploadToStorage(recordedBlob);
  });

  //Size and Type of the recorded Media is logged
  console.log("Successfully recorded " + recordedBlob.size + " bytes of " + recordedBlob.type + " media.");
}

//
//Upload Notice
//
uploadVideoNotice.addEventListener("click", function() {
  uploadNotice.style.display = "block";
  uploadNotice.style.opacity = "1";
});

uploadNoticeClose.addEventListener("click", function() {
  uploadNotice.style.display = "none";
  uploadNotice.style.opacity = "0";
});

uploadNoticeCancel.addEventListener("click", function() {
  uploadNotice.style.display = "none";
  uploadNotice.style.opacity = "0";
});


//
// Firebase Storage 
//
function uploadToStorage(recordedBlob) {

  // Points to the root reference
  var storageRef = firebase.storage().ref();

  // File or Blob
  var file = recordedBlob;

  // Create the file metadata
  var metadata = {
    contentType: 'video/mp4'
  };

  //Create GUID for file name
  var lut = []; for (var i=0; i<256; i++) { lut[i] = (i<16?'0':'')+(i).toString(16); }

  function guid() {
    var k=['x','x','-','x','-','4','-','y','-','x','x','x'];
    var u='',i=0,rb=Math.random()*0xffffffff|0;
    while(i++<12) {
      var c=k[i-1],r=rb&0xffff,v=c=='x'?r:(c=='y'?(r&0x3fff|0x8000):(r&0xfff|0x4000));
      u+=(c=='-')?c:(lut[v>>8]+lut[v&0xff]);rb=i&1?rb>>16:Math.random()*0xffffffff|0
    }
    return u
  }

  let videoID = guid();

  // Upload file and metadata to the object 'uploads/mixmatch.mp4'
  var uploadTask = storageRef.child('uploads/' + 'mixmatch-slice' + window.webcamPosition + '-' + videoID + '.mp4').put(file, metadata);

  // Listen for state changes, errors, and completion of the upload.
  uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
    function(snapshot) {
      // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
      var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      uploadBar.value = progress;
      console.log('Upload is ' + progress + '% done');
      if (progress == 100) {
        uploadSuccessful();
      }
      switch (snapshot.state) {
        case firebase.storage.TaskState.PAUSED: // or 'paused'
          console.log('Upload is paused');
          break;
        case firebase.storage.TaskState.RUNNING: // or 'running'
          console.log('Upload is running');
          break;
      }
    }, function(error) {

    // A full list of error codes is available at
    // https://firebase.google.com/docs/storage/web/handle-errors
    switch (error.code) {
      case 'storage/unauthorized':
        // User doesn't have permission to access the object
        console.log('User doesnt have permission to access the object');
        break;

      case 'storage/canceled':
        // User canceled the upload0
        console.log('User canceled the upload');
        break;

      case 'storage/unknown':
        // Unknown error occurred, inspect error.serverResponse
        console.log('Unknown error occurred, inspect error.serverResponse');
        break;
    }
  }, function() {
    // Upload completed successfully, now we can get the download URL
    uploadTask.snapshot.ref.getDownloadURL().then(function(downloadURL) {
      //console.log('File available at', downloadURL);
    });
  });

  //Display ID
  function uploadSuccessful() {
    let uploadID = document.getElementById("uploadID");
    let contentID = document.createTextNode(videoID);
    uploadID.appendChild(contentID);

    let uploadNoticePage1 = document.getElementById("uploadNoticePage1");
    let uploadNoticePage2 = document.getElementById("uploadNoticePage2");
    uploadNoticePage1.style.display = "none";
    uploadNoticePage1.style.opacity = "0";
    uploadNoticePage2.style.display = "block";
    uploadNoticePage2.style.opacity = "1";
  };
}

//Change videoContainerOutput and videoContainerRecording Position 
for (let i = 0; i < videos.length; i++) {
  videos[i].addEventListener("click", function() {
    console.log('Webcam Position: ' + this.dataset.index);
    window.webcamPosition = this.dataset.index;

    if (this.dataset.index == 1) {
      videoContainerOutput.style.top = "0%";
      videoContainerRecording.style.top = "0%";
    }

    if (this.dataset.index == 2) {
      videoContainerOutput.style.top = "30%";
      videoContainerRecording.style.top = "30%";
    }

    if (this.dataset.index == 3) {
      videoContainerOutput.style.top = "60%";
      videoContainerRecording.style.top = "60%";
    }
  });
}

//
//Swipe Gesture
//
function detectswipe(el,func) {
  swipe_det = new Object();
  swipe_det.sX = 0;
  swipe_det.sY = 0;
  swipe_det.eX = 0;
  swipe_det.eY = 0;
  var min_x = 50;  //min x swipe for horizontal swipe
  var max_x = 40;  //max x difference for vertical swipe
  var min_y = 40;  //min y swipe for vertical swipe
  var max_y = 50;  //max y difference for horizontal swipe
  var direc = "";
  ele = document.getElementById(el);
  ele.addEventListener('touchstart',function(e){
    var t = e.touches[0];
    swipe_det.sX = t.screenX; 
    swipe_det.sY = t.screenY;
  },false);
  ele.addEventListener('touchmove',function(e){
    e.preventDefault();
    var t = e.touches[0];
    swipe_det.eX = t.screenX; 
    swipe_det.eY = t.screenY;    
  },false);
  ele.addEventListener('touchend',function(e){
    //horizontal detection
    if ((((swipe_det.eX - min_x > swipe_det.sX) || (swipe_det.eX + min_x < swipe_det.sX)) && ((swipe_det.eY < swipe_det.sY + max_y) && (swipe_det.sY > swipe_det.eY - max_y)))) {
      if(swipe_det.eX > swipe_det.sX) direc = "r";
      else direc = "l";
    }
    //vertical detection
    if ((((swipe_det.eY - min_y > swipe_det.sY) || (swipe_det.eY + min_y < swipe_det.sY)) && ((swipe_det.eX < swipe_det.sX + max_x) && (swipe_det.sX > swipe_det.eX - max_x)))) {
      if(swipe_det.eY > swipe_det.sY) direc = "d";
      else direc = "u";
    }

    if (direc != "") {
      if(typeof func == 'function') func(el,direc);
    }
    direc = "";
  },false);  
}

//
//Load Videos
//
async function loadVideos(){

  // Points to the root reference
  var storageRef = firebase.storage().ref();

  // List Reference
  var listRef1 = storageRef.child('videos/slice1');
  var listRef2 = storageRef.child('videos/slice2');
  var listRef3 = storageRef.child('videos/slice3');

  //List Elements
  var firstPage1 = await listRef1.list({maxResults: 10});
  displayVideos1(firstPage1.items);  

  var firstPage2 = await listRef2.list({maxResults: 10});
  displayVideos2(firstPage2.items); 

  var firstPage3 = await listRef3.list({maxResults: 10});
  displayVideos3(firstPage3.items); 

  // Fetch the second page if there are more elements.
  if (firstPage1.nextPageToken) {
    var secondPage1 = await listRef1.list({
      maxResults: 10,
      pageToken: firstPage1.nextPageToken,
    });
    // processItems(secondPage1.items)
    // processPrefixes(secondPage1.prefixes)
  }
}
loadVideos();

//
// Display loaded Videos
//
function displayVideos1(videoRef) {

  var count = 0;
  var videoElement1 = document.querySelector("#videoElement1");

  detectswipe('videoElement1', swipeVideo1);

  function swipeVideo1(el,d){
    if (d == "l" && editActive == false) {
      //console.log("Swipe Left");
      videoRef[++count % videoRef.length].getDownloadURL().then(function(url) {
        videoElement1.src = url; 
      })
    }
    if (d == "r" && editActive == false) {
      //console.log("Swipe Right");
      videoRef[--count % videoRef.length].getDownloadURL().then(function(url) {
        videoElement1.src = url; 
      })
    }
  }

  videoButtonRight[0].addEventListener("click", function(){
    if (editActive == false) {
      videoRef[++count % videoRef.length].getDownloadURL().then(function(url) {
        videoElement1.src = url; 
      })
    }
  })

  videoButtonLeft[0].addEventListener("click", function(){
    if (editActive == false) {
      videoRef[--count % videoRef.length].getDownloadURL().then(function(url) {
        videoElement1.src = url; 
      })
    }
  })

}

function displayVideos2(videoRef) {

  var count = 0;
  var videoElement2 = document.querySelector("#videoElement2");

  detectswipe('videoElement2', swipeVideo2);

  function swipeVideo2(el,d){
    if (d == "l" && editActive == false) {
      //console.log("Swipe Left");
      videoRef[++count % videoRef.length].getDownloadURL().then(function(url) {
        videoElement2.src = url; 
      })
    }
    if (d == "r" && editActive == false) {
      //console.log("Swipe Right");
      videoRef[--count % videoRef.length].getDownloadURL().then(function(url) {
        videoElement2.src = url; 
      })
    }
  }

  videoButtonRight[1].addEventListener("click", function(){
    if (editActive == false) {
      videoRef[++count % videoRef.length].getDownloadURL().then(function(url) {
        videoElement2.src = url; 
      })
    }
  })

  videoButtonLeft[1].addEventListener("click", function(){
    if (editActive == false) {
      videoRef[--count % videoRef.length].getDownloadURL().then(function(url) {
        videoElement2.src = url; 
      })
    }
  })

}

function displayVideos3(videoRef) {

  var count = 0;
  var videoElement3 = document.querySelector("#videoElement3");

  detectswipe('videoElement3', swipeVideo3);

  function swipeVideo3(el,d){
    if (d == "l" && editActive == false) {
      //console.log("Swipe Left");
      videoRef[++count % videoRef.length].getDownloadURL().then(function(url) {
        videoElement3.src = url; 
      })
    }
    if (d == "r" && editActive == false) {
      //console.log("Swipe Right");
      videoRef[--count % videoRef.length].getDownloadURL().then(function(url) {
        videoElement3.src = url; 
      })
    }
  }

  videoButtonRight[2].addEventListener("click", function(){
    if (editActive == false) {
      videoRef[++count % videoRef.length].getDownloadURL().then(function(url) {
        videoElement3.src = url; 
      })
    }
  })

  videoButtonLeft[2].addEventListener("click", function(){
    if (editActive == false) {
      videoRef[--count % videoRef.length].getDownloadURL().then(function(url) {
        videoElement3.src = url; 
      })
    }
  })

}

/*
function displayVideos3(videoRef) {

  var count = 0;
  var videoElement3 = document.querySelector("#videoElement3");

  videoElement3.addEventListener("click", function(){

    videoRef[++count % videoRef.length].getDownloadURL().then(function(url) {
      
      videoElement3.addEventListener("click", function(){
        this.src = url; 
      })
  
    })
  })
}
*/

//
//Sound - Mute Option
//
for (let i = 0; i < muteVideoButton.length; i++) {
  muteVideoButton[i].addEventListener("click", function() {

    if (videos[this.dataset.index - 1].muted == true) {
      videos[this.dataset.index - 1].muted = false;
      this.firstElementChild.src = "img/icons/unmute.svg";
    } else {
      videos[this.dataset.index - 1].muted = true;
      this.firstElementChild.src = "img/icons/mute.svg";
    }
  
  });
}

//
//Video Scrolling / Custom Seekbar
//
let seekbar = document.querySelectorAll('.seekbar');

for (let i = 0; i < videos.length; i++) {

  videos[i].ontimeupdate = function(){
    let percentage = ( videos[i].currentTime / videos[i].duration ) * 100;
    seekbar[i].children[0].style.width = percentage+"%";
  };

  seekbar[i].addEventListener("click", function(e){
    let offset = this.getBoundingClientRect();
    let left = (e.pageX - offset.left);
    let totalWidth = seekbar[i].offsetWidth;
    let percentage = ( left / totalWidth );
    let vidTime = videos[i].duration * percentage;
    videos[i].currentTime = vidTime;
  });

}


//
//Edit
//
let buttonEdit = document.getElementById("buttonEdit");
let editControls = document.querySelectorAll('.editControls');
let editActive = false;

buttonEdit.addEventListener('click', function() {

  if (editActive == false) {
    for (let i = 0; i < editControls.length; i++) {
      editControls[i].style.opacity = "1";
      editControls[i].style.display = "block";
      buttonEdit.firstElementChild.src = "img/icons/edit_active.svg";
    }
    editActive = true;
  } else {
    for (let i = 0; i < editControls.length; i++) {
      editControls[i].style.opacity = "0";
      editControls[i].style.display = "none";
      buttonEdit.firstElementChild.src = "img/icons/edit_idle.svg";
    }
    editActive = false;
  }

});

//
//Record new Video (Display Live Feed)
//

detectswipe('videoContainerRecording', showLivefeed);

function showLivefeed(el,d){
  if (d == "u") {
    //console.log("Swipe Up");
    videoContainerRecording.style.zIndex = "5";
  }
}

showLiveVideoButton.addEventListener("click", function(){
  videoContainerRecording.style.zIndex = "5";
});

//
//Walktrough Carousel
//
let slideIndex = 1;
let walkthrough = document.getElementById("walkthrough");
let walkthroughNext = document.getElementById("walkthroughNext");
let walkthroughClose = document.getElementById("walkthroughClose");

walkthroughNext.addEventListener("click", nextSlide); 
walkthroughClose.addEventListener("click", closeWalkthrough);

function nextSlide() {
  let walkthroughDots = document.querySelectorAll(".dot");
  var i;
  var slides = document.querySelectorAll(".walkthroughScreen"); 
  if (slideIndex == slides.length - 1) {
    walkthroughNext.innerHTML = "Start";
  }
  if (slideIndex == slides.length) {
    closeWalkthrough();
    return;
  }

  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  for (i = 0; i < walkthroughDots.length; i++) {
    walkthroughDots[i].className = walkthroughDots[i].className.replace(" active", "");
    walkthroughDots[i].style.background = "rgba(14, 14, 14, 0.25)";
  }

  if ((slideIndex == 0) || (slideIndex == 3)) {
    walkthroughClose.style.color = "#e27c5d";
    walkthroughNext.style.color = "#e27c5d";
    walkthroughDots[slideIndex].style.background = "#e27c5d";
  } else if ((slideIndex == 1) || (slideIndex == 4)) {
    walkthroughClose.style.color = "#44a8a0";
    walkthroughNext.style.color = "#44a8a0";
    walkthroughDots[slideIndex].style.background = "#44a8a0";
  } else {
    walkthroughClose.style.color = "#3c636e";
    walkthroughNext.style.color = "#3c636e";
    walkthroughDots[slideIndex].style.background = "#3c636e";
  }

  slides[slideIndex].style.display = "block";
  slides[slideIndex].style.opacity = "1";
  walkthroughDots[slideIndex].className += " active";
  slideIndex += 1;
};

function closeWalkthrough() {
  walkthrough.style.opacity = "0";
  walkthrough.style.display = "none";
};

//
//Report Notice
//
let reportNotice = document.getElementById("reportNotice");
let reportVideoButton = document.querySelectorAll('.reportVideo');
let reportCancel = document.getElementById("reportCancel");
let reportSend = document.getElementById("reportSend");
let reportClose = document.getElementById("reportClose");
let reportNoticePage1 = document.getElementById("reportNoticePage1");
let reportNoticePage2 = document.getElementById("reportNoticePage2");
let reportButtonClicked;

reportCancel.addEventListener("click", function() {
  reportNotice.style.display = "none";
  reportNotice.style.opacity = "0";
});

reportClose.addEventListener("click", function() {
  reportNotice.style.display = "none";
  reportNotice.style.opacity = "0";
  reportNoticePage1.style.display = "block";
  reportNoticePage1.style.opacity = "1";
  reportNoticePage2.style.display = "none";
  reportNoticePage2.style.opacity = "0";
});

for (let i = 0; i < reportVideoButton.length; i++) {
  reportVideoButton[i].addEventListener("click", function() {
    reportButtonClicked = i;
    reportNotice.style.display = "block";
    reportNotice.style.opacity = "1";
  });
}

reportSend.addEventListener("click", function() {
  //Save Report Data in Firebase Database
  uploadReport(reportButtonClicked);
  reportSuccessful();
});

function reportSuccessful() {
  reportNoticePage1.style.display = "none";
  reportNoticePage1.style.opacity = "0";
  reportNoticePage2.style.display = "block";
  reportNoticePage2.style.opacity = "1";
}

//Upload Report to Database
let database = firebase.database();

function uploadReport(sliceIndex) {
  //Get the ID of the reported Video
  let videoLink = videos[sliceIndex].src;
  let parts = videoLink.split(".mp4");
  let slicePosition = parts[0].lastIndexOf("slice");
  let idPosition = slicePosition + 7;
  let stringLength = parts[0].length;
  let videoID = parts[0].slice(idPosition, stringLength);
  let videoSlice = parts[0].slice(slicePosition, slicePosition + 6);

  //Get selected Report Reason
  let selectedReport
  var radioButtons = document.getElementsByName('report');    
  for(i = 0; i < radioButtons.length; i++) { 
    if(radioButtons[i].checked) {
      selectedReport = radioButtons[i].value; 
    }
  } 

  //Store ID and Reason and save it to the database
  let data = {
    videoID: videoID,
    slice: videoSlice,
    reason: selectedReport
  }

  console.log(data);
  let ref = database.ref("reports");
  ref.push(data);

};


