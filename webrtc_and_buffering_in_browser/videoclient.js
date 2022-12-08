const video_live = document.querySelector('#video_live');
video_live.captureStream = video_live.captureStream || video_live.mozCaptureStream;

const configuration = {iceServers: [{urls: 'stun:stun.1.google.com:19302'}]};
const pc = new RTCPeerConnection(configuration);

const ws = new WebSocket('ws://localhost:8080');

ws.onmessage = async (event) => {
    let msg = JSON.parse(event.data);
    if (msg.dst == 'videoclient') {
        switch (msg.type) {
            case 'icecandidate':
                await pc.addIceCandidate(msg.data);
                break;
            case 'offer':
                await pc.setRemoteDescription(msg.data);
                
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                
                const respmsg = {src: 'videoclient', dst: 'videosource', type: 'answer', data: answer};
                ws.send(JSON.stringify(respmsg));            
                break;
        }
    }    
};

pc.onicecandidate = async (event) => {
    if (event.candidate) {
        const msg = {src: 'videoclient', dst: 'videosource', type: 'icecandidate', data: event.candidate};
        ws.send(JSON.stringify(msg));
    }
}

let recorder;
let buffer = [];
let blobs = [];
let blobs_index = 0;
let state = 'live';

const video_playback = document.querySelector('#video_playback');

pc.ontrack = async (event) => {
    video_live.srcObject = event.streams[0];
    video_live.play();

    recorder = new MediaRecorder(event.streams[0]);

    recorder.ondataavailable = (event) => {
        buffer.push(event.data);
    }

    recorder.onstop = (event) => {
        blobs.push(new Blob(buffer));
        buffer = [];
        
        if (state != 'playback' && blobs.length > 10) {
            blobs.shift();
        }
        
        if (state == 'enter_playback') {
            state = 'playback';
            video_live.style.display = 'none';
            blobs_index = blobs.length - 1;
            video_playback.src = URL.createObjectURL(blobs[blobs_index]);
            video_playback.currentTime = 2.0;
            video_playback.style.display = 'inline';
        }

        startRecording();
    }

    startRecording();
}

function startRecording() {
    recorder.start();
    setTimeout(() => {
        recorder.stop();
    }, 1000);
}

const button_back = document.querySelector('#button_back');
const button_play = document.querySelector('#button_play');
const button_pause = document.querySelector('#button_pause');
const button_forward = document.querySelector('#button_forward');
button_back.addEventListener('click', back);
button_play.addEventListener('click', play);
button_pause.addEventListener('click', pause);
button_forward.addEventListener('click', forward);

async function back() {
    if (video_playback.currentTime - 0.1 < 0) {
        if (blobs_index > 0) {
            console.log('prev');
            blobs_index--;
            video_playback.src = URL.createObjectURL(blobs[blobs_index]);
            video_playback.currentTime = 2.0;
        }
        else {
            console.log('get file');
            await playNextFile();
        }
    }
    else {
        video_playback.currentTime -= 0.1;
    }
}

async function forward() {
    if (video_playback.currentTime + 0.1 > video_playback.duration) {
        if (blobs_index < blobs.length - 1) {
            console.log('next');
            blobs_index++;
            video_playback.src = URL.createObjectURL(blobs[blobs_index]);
            video_playback.currentTime = 0;            
        }
    }
    else {
        video_playback.currentTime += 0.1;
    }
}

async function play() {
    state = 'live';
    video_live.style.display = 'inline';
    video_playback.style.display = 'none';
}

async function pause() {
    state = 'enter_playback';
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
    video_playback.src = URL.createObjectURL(blob);
    video_playback.currentTime = 6.0;
    console.log('play file');
}
