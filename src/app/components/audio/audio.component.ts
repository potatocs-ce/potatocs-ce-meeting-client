import { CommonModule } from '@angular/common';
import { Component, Input, effect } from '@angular/core';
import { VideoService } from '../../services/video/video.service';

@Component({
  selector: 'app-audio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audio.component.html',
  styleUrl: './audio.component.scss'
})
export class AudioComponent {
  audioList: any;

  // constructor(private videoService: VideoService) {
  //   effect(() => {
  //     this.audioList = this.videoService.audioStream();
  //   })
  // }

  @Input() id: string = ''
  @Input() stream: any;
  @Input() socket_id: string = '';


  ngAfterViewInit() {
    const my_audio = document.getElementsByClassName(this.id)[0] as HTMLAudioElement;
    my_audio.autoplay = true;
    my_audio.pause();
    my_audio.muted = true;


    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      // 오디오 컨텍스트 생성
      let audioContext = new AudioContext();
      // 소스 노드 생성
      let source = audioContext.createMediaStreamSource(this.stream);

      // Analyser 노드 생성
      let analyser = audioContext.createAnalyser();
      source.connect(analyser);

      // FFT 크기 설정 (분석을 위한 배열의 크기)
      analyser.fftSize = 2048;
      let bufferLength = analyser.frequencyBinCount;
      let dataArray = new Uint8Array(bufferLength);

      let audioTime: any;

      // console.log(video);
      // 소리 데시벨 모니터링
      const monitorDecibel = () => {
        // FFT 데이터 가져오기
        analyser.getByteFrequencyData(dataArray);

        // 데시벨 값 계산
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        let average = sum / bufferLength;
        let decibel = 20 * Math.log10(average / 255);
        // console.log(decibel)
        // 임계값 초과 시 콘솔에 로그 출력
        // -20 데시벨
        if (decibel > -20) {
          const video: any = document.getElementsByClassName(`${this.socket_id}`)[0];
          if (video) video.style.border = '2px solid rgba(255, 180, 18)'

          my_audio.play();
          if (audioTime) {
            clearTimeout(audioTime)
          }

          console.log(`${name}의 소리가 -20dB를 초과했습니다!`);

          audioTime = setTimeout(() => {
            if (video) video.style.border = '2px solid rgba(0,0,0,0)'
            my_audio.pause();
          }, 3000);
        }

        // 주기적으로 모니터링
        requestAnimationFrame(monitorDecibel);
      }
      // 소리 데시벨 모니터링 시작
      monitorDecibel();
    })
  }
}
