import { Injectable, signal } from '@angular/core';
import { ToggleService } from '../toggle/toggle.service';

@Injectable({
  providedIn: 'root'
})
export class VideoService {

  constructor(private toggleService: ToggleService) { }

  // 장치 리스트
  videoDeivces = signal<Array<any>>([]);
  audioDevices = signal<Array<any>>([]);
  speakerDevices = signal<Array<any>>([]);

  // 현재 내 비디오, 오디오
  nowVideoId: any = signal<string>('');
  nowAudioId: any = signal<string>('');
  nowSpeakerId: any = signal<string>('');

  audioDeviceExist: any = signal<boolean>(true);
  videoDeviceExist: any = signal<boolean>(true);


  // // 현재 발표 비디오 스트림
  // presentVideoStream = signal<any>(undefined);


  // // 현재 청중들 비디오 스트림
  // audienceVideoStream = signal<Array<any>>([]);


  // 현재 오디오 스트림
  audioStream = signal<Array<any>>([]);



  // 현재 비디오 & 오디오 로딩
  videoLoading: any = signal<boolean>(false);
  audioLoading: any = signal<boolean>(false);


  // 벤 리스트

  // 유저 비디오 가져오기
  getUserVideo = async (id: string) => {
    try {

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false, video: {
          deviceId: id,
          width: {
            min: 640,
            ideal: 1920
          },
          height: {
            min: 400,
            ideal: 1080
          }
        }
      })
      // this.presentVideoStream.set(stream);

      // this.audienceVideoStream.set([...this.audienceVideoStream(), stream])
      this.toggleService.toggle_video.set(true);
    } catch (err) {
      console.error(err)
    }
  }

  stopVideo = async () => {
    // const stream = this.presentVideoStream();

    // if (stream) {
    //   const tracks = stream.getTracks();

    //   // 각 트랙에 대해 중지 메서드 호출
    //   tracks.forEach((track: any) => {
    //     track.stop();
    //   });
    // }


    // this.presentVideoStream.set(undefined);
    this.toggleService.toggle_video.set(false);
  }

  clearData() {
    // 장치 리스트
    this.videoDeivces.set([])
    this.audioDevices.set([])
    // 현재 내 비디오, 오디오
    this.nowVideoId.set('')
    this.nowAudioId.set('')

    // // 현재 발표 비디오 스트림
    // this.presentVideoStream.set(undefined)


    // // 현재 청중들 비디오 스트림
    // this.audienceVideoStream.set([]);


    // 현재 오디오 스트림
    this.audioStream.set([]);



    // 현재 비디오 & 오디오 로딩
    this.videoLoading.set(false);
    this.audioLoading.set(false);

  }



}
