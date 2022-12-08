const ws = new WebSocket('ws://localhost:8080');

ws.onmessage = async (event) => {    
    let msg = JSON.parse(event.data);
    if (msg.dst == 'videosource') {
        switch (msg.type) {
            case 'icecandidate':                
                await pc.addIceCandidate(msg.data);
                break;
            case 'answer':
                await pc.setRemoteDescription(msg.data);
                break;    
        }
    }    
};

const button_camera = document.querySelector('#button_camera');
button_camera.addEventListener('click', playCameraStream);

const button_file = document.querySelector('#button_file');
button_file.addEventListener('click', playFileStream);

let video_source = document.querySelector('#video_source');
video_source.captureStream = video_source.captureStream || video_source.mozCaptureStream;
let rtpSender = null;

const configuration = {iceServers: [{urls: 'stun:stun.1.google.com:19302'}]};
const pc = new RTCPeerConnection(configuration);

pc.onicecandidate = async (event) => {
    if (event.candidate) {
        const msg = {src: 'videosource', dst: 'videoclient', type: 'icecandidate', data: event.candidate};
        ws.send(JSON.stringify(msg));
    }
}

async function playCameraStream(event) {
    var stream = await navigator.mediaDevices.getUserMedia({video: true, audio: false});
    video_source.src = '';
    video_source.srcObject = stream;
    video_source.play();
    startCaptureStream();
}

function getFile(filename) {
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
    video_source.src = url;
    video_source.play();
}

async function playFileStream() {
    // video_live.srcObject.getTracks().forEach((track) => {
    //     track.stop();
    // });
    video_source.srcObject = null;    
    video_source.onended = async () => {
        await playNextFile();
    }
    await playNextFile();
    startCaptureStream();
}

const button_send = document.querySelector('#button_send');
const video_captured = document.querySelector('#video_captured');
button_send.addEventListener('click', sendVideo);

let captured_stream;
let recorder;
let buffer = [];

function startCaptureStream() {
    //setTimeout(() => {
        captured_stream = video_source.captureStream();
        video_captured.srcObject = captured_stream;     
    //}, 100);
}

async function sendVideo() {
    // let videoTrack = stream.getVideoTracks()[0];
    // rtpSender.replaceTrack(videoTrack);

    rtpSender = pc.addTrack(captured_stream.getVideoTracks()[0], captured_stream);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const msg = {src: 'videosource', dst: 'videoclient', type: 'offer', data: offer};
    ws.send(JSON.stringify(msg));
}