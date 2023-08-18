import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import 'webrtc-adapter'; // adapter.js 불러오기 -> 기본으로는 global로 설정되는 듯.

const ICE_SERVERS: RTCIceServer[] = [
  // { urls: ['stun:stun.example.com', 'stun:stun-1.example.com'] },
  // { urls: 'stun:stun.l.google.com:19302' }
  { urls: 'turn:54.180.58.25 [ubuntu:roottoor]' }
  // { urls: 'turn:54.180.58.25' }
];
const PEER_CONNECTION_CONFIG: RTCConfiguration = {
  iceServers: ICE_SERVERS
};

@Injectable({
  providedIn: 'root'
})
export class WebRTCService {
  private _localStream$: BehaviorSubject<MediaStream>;
  private _remoteStream$: BehaviorSubject<MediaStream>;
  public localStream$: Observable<MediaStream>;
  public remoteStream$: Observable<MediaStream>;


  private _iceCandidateEvent$: BehaviorSubject<any>;
  public iceCandidateEvent$: Observable<any>;

  private _bitRate$: BehaviorSubject<number>;
  private _packetSent$: BehaviorSubject<number>;
  public bitRate$: Observable<number>;
  public packetSent$: Observable<number>;
  private intervalId;

  constructor() {
    this._localStream$ = new BehaviorSubject(null);
    this._remoteStream$ = new BehaviorSubject(null);
    this.localStream$ = this._localStream$.asObservable();
    this.remoteStream$ = this._remoteStream$.asObservable();

    this._iceCandidateEvent$ = new BehaviorSubject(null);
    this.iceCandidateEvent$ = this._iceCandidateEvent$.asObservable();

    this._bitRate$ = new BehaviorSubject(0);
    this.bitRate$ = this._bitRate$.asObservable();

    this._packetSent$ = new BehaviorSubject(0);
    this.packetSent$ = this._packetSent$.asObservable();

  }

  /*-------------------------------------------------------
      Local, Remote Stream , ice candidate event
  ----------------------------------------------------------*/
  get localStream(): any {
    return this._localStream$.getValue();
  }
  get remoteStream(): any {
    return this._remoteStream$.getValue();
  }


  updateLocalStream(stream) {
    this._localStream$.next(stream);
  }


  deleteLocalStream(stream) {
    memory.reset()
    this._localStream$.next(stream);
  }


  /**
   * 내 Local Video 불러오기
   */
  async getMediaStream(options) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(options)
      this.updateLocalStream(stream);
      // 디바이스 체크 창에서 소리가 나오지 않게 하기
      stream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
    } catch (e) {
      throw e;
    }
  }



}
