import '../css/reset.scss';
import '../css/styles.scss';

import * as faceapi from 'face-api.js';

// 감정과 노래 파일들 간의 매핑을 저장하기 위한 객체를 추가합니다.
const emotionSongs = {
  happy: './src/assets/music/Alpha Mission - Jimena Contreras.mp3',
  sad: './src/assets/music/Kirwani - Teental - Aditya Verma, Subir Dev.mp3',
  angry: './src/assets/music/Raga Legacy - Hanu Dixit.mp3',
  // 필요에 따라 감정과 해당하는 노래를 추가합니다.
};

class FaceEmotionDetector {
  constructor() {
    this.MILISECOND_VALUE = 100;
    this.EMOTION_THRESHOLD = 0.7;

    this.video = document.querySelector('#video');

    this.getBoxSize();

    this.promiseFunctions();

    this.videoEventListener();

    this.currentSong = null;
    this.currentEmotion = null;
    this.isEmotionDetected = false;
  }

  getBoxSize() {
    const positionInfo = this.video.getBoundingClientRect();
    const height = positionInfo.height;
    const width = positionInfo.width;

    this.boxSize = { width, height };

    return this.boxSize;
  }

  startCamera() {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        this.video.srcObject = stream;
      })
      .catch((error) => {
        console.log('Error accessing camera:', error);
      });
  }

  videoEventListener() {
    this.video.addEventListener('play', () => {
      const canvas = faceapi.createCanvasFromMedia(this.video);
      document.body.append(canvas);

      faceapi.matchDimensions(canvas, this.boxSize);

      setInterval(() => this.intervalCallback(canvas), this.MILISECOND_VALUE);
    });

    this.video.addEventListener('pause', () => {
      // 현재 재생 중인 노래를 멈춥니다.
      if (this.currentSong) {
        this.currentSong.pause();
        this.currentSong = null;
      }
    });
  }

  async intervalCallback(canvas) {
    const detections = await faceapi
      .detectSingleFace(this.video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

    if (detections) {
      const resizeDetections = faceapi.resizeResults(detections, this.boxSize);

      faceapi.draw.drawDetections(canvas, resizeDetections);
      faceapi.draw.drawFaceLandmarks(canvas, resizeDetections);
      faceapi.draw.drawFaceExpressions(canvas, resizeDetections);

      // 우세한 감정을 가져옵니다.
      const emotions = detections.expressions;
      const dominantEmotion = getDominantEmotion(emotions);

      // 우세한 감정이 변경되었는지 확인합니다.
      if (dominantEmotion !== this.currentEmotion) {
        this.currentEmotion = dominantEmotion;
        this.isEmotionDetected = true;
      } else {
        this.isEmotionDetected = false;
      }

      // 우세한 감정에 해당하는 노래를 재생합니다.
      if (dominantEmotion && emotions[dominantEmotion] > this.EMOTION_THRESHOLD) {
        const songFile = emotionSongs[dominantEmotion];
        if (songFile) {
			if (!this.currentSong || this.isEmotionDetected) {
				if (this.currentSong) {
				  this.currentSong.pause();
				}
				this.currentSong = playSong(songFile);
			  }
			}
		  } else {
			// 감정이 감지되지 않거나 임계값을 넘지 못할 경우 노래를 멈춥니다.
			if (this.currentSong) {
			  this.currentSong.pause();
			  this.currentSong = null;
			}
		  }
		}
	  }
