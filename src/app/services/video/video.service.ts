import { Injectable, signal } from '@angular/core';
import { ToggleService } from '../toggle/toggle.service';

@Injectable({
  providedIn: 'root'
})
export class VideoService {

  constructor(private toggleService: ToggleService) { }

  // 장치 리스트
  videoDeivces = signal<Array<object>>([]);
  audioDevices = signal<Array<object>>([]);

  // 현재 내 비디오, 오디오
  nowVideoId: any = signal<string>('');
  nowAudioId = signal<string>('');

  presentVideoStream = signal<any>(undefined);


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
      this.presentVideoStream.set(stream);
      this.toggleService.toggle_video.set(true);
    } catch (err) {
      console.error(err)
    }
  }

  stopVideo = async () => {
    const stream = this.presentVideoStream();

    if (stream) {
      const tracks = stream.getTracks();

      // 각 트랙에 대해 중지 메서드 호출
      tracks.forEach((track: any) => {
        track.stop();
      });
    }


    this.presentVideoStream.set(undefined);
    this.toggleService.toggle_video.set(false);
  }
}
