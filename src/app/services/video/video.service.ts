import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VideoService {

  constructor() { }

  videoDeivces = signal<Array<object>>([]);
  audioDevices = signal<Array<object>>([]);

  nowVideoId = signal<string>('');
  nowAudioId = signal<string>('');
}
