import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VideoService {

  constructor() { }

  videoDeivces = signal<Array<string>>([]);
  audioDevices = signal<Array<string>>([]);
}
