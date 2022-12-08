let video_live_current_time = document.querySelector('#live .status .current');
let video_recorded_current_time = document.querySelector('#recorded .status .current');
let video_recorded_end_time = document.querySelector('#recorded .status .end');

let video_live = document.querySelector('#live video');
video_live.addEventListener('timeupdate', (e) => {
    video_live_current_time.innerText = e.target.currentTime;
});

let video_recorded = document.querySelector('#recorded video');

let recorder;
let buf = [];

document.querySelector('#btn_file').addEventListener('click', onBtnFileClick);
document.querySelector('#btn_camera').addEventListener('click', onBtnCameraClick);
document.querySelector('#btn_back').addEventListener('click', onBtnBackClick);
document.querySelector('#btn_start_recording').addEventListener('click', onBtnStartRecordingClick);
document.querySelector('#btn_stop_recording').addEventListener('click', onBtnStopRecordingClick);
document.querySelector('#btn_forward').addEventListener('click', onBtnForwardClick);

async function getFile(filename) {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', filename);
        xhr.responseType = 'blob';    
        xhr.onload = () => {
            resolve(xhr.response);
        }
        xhr.onerror = () => {
            reject({status: xhr.status, statusText: xhr.statusText});
        }
        xhr.send();
    });    
}

async function playNextFile() {
    if( typeof playNextFile.index == 'undefined' ) {
        playNextFile.index = 0;
    }
    
    let blob = await getFile('/' + playNextFile.index + '.mp4');
    playNextFile.index = (playNextFile.index + 1) % 4;
    let url = URL.createObjectURL(blob);
    video_live.src = url;
    video_live.play();
}

async function onBtnFileClick() {
    // video_live.srcObject.getTracks().forEach((track) => {
    //     track.stop();
    // });
    video_live.srcObject = null;    
    video_live.onended = () => {
        playNextFile();
    }
    playNextFile();
}

async function onBtnCameraClick() {
    video_live.srcObject = await navigator.mediaDevices.getUserMedia({video: true, audio: false});
    video_live.play();
}

async function onBtnStartRecordingClick() {
    console.log('start recording');
    // This doesn't work if the source of video is from video.src not video.srcObject.
    //recorder = new MediaRecorder(video_live.srcObject, {mimeType: 'video/webm\;codecs=h264'}); // produces 'video/x-matroska\;codecs=avc1'
    recorder = new MediaRecorder(video_live.captureStream(), {mimeType: 'video/webm\;codecs=h264'}); // produces 'video/x-matroska\;codecs=avc1'
    //recorder = new MediaRecorder(video.srcObject, {mimeType: 'video/x-matroska\;codecs=avc1'});
    //recorder = new MediaRecorder(video.srcObject, {mimeType: 'video/webm\;codecs=vp9'});

    // TBD: there are issues with the video element when trying to display the same content in live and recorded videobox while recording.
    // video_recorded.srcObject = video_live.captureStream();
    // video_recorded.play();

    recorder.ondataavailable = function(e) {
        console.log(e.data);
        buf.push(e.data);
    }
    
    recorder.onstop = function(e) {
        console.log(e.data);
        let blob = new Blob (buf, {'type': 'video/webm\;codecs=h264'});
        buf = [];
        
        video_recorded.addEventListener('timeupdate', (e) => {
            video_recorded_current_time.innerText = e.target.currentTime;
            video_recorded_end_time.innerText = e.target.duration;
        });

        video_recorded.src = URL.createObjectURL(blob);
    }
    recorder.start(1000); // Dump recorded video buffer every 1000ms.
}

async function onBtnStopRecordingClick()
{
    recorder.stop();
}

function onBtnBackClick()
{
    video_recorded.currentTime -= 0.1;
}

function onBtnForwardClick()
{
    video_recorded.currentTime += 0.1;
}
