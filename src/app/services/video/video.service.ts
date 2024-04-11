import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VideoService {

  constructor() { }

  // 장치 리스트
  videoDeivces = signal<Array<object>>([]);
  audioDevices = signal<Array<object>>([]);

  // 현재 내 비디오, 오디오
  nowVideoId = signal<string>('');
  nowAudioId = signal<string>('');

  presentVideoStream = signal<any>(undefined);

}
