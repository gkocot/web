Demo showing how to buffer/capture video in the browser.
Can capture MediaStream from camera (this simulates live WebRTC stream).
Can capture MediaSource from file (this simulates playback could be delivered as files through WebRTC data channel).

Issues:
- Tested on Chrome 89, need to check how it works on other browsers;
- With some test .mp4 files video freezes, why? Because they are bigger, too much processing in the browser?