import { CommonModule } from '@angular/common';
import { Component, effect } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { ToggleService } from '../../services/toggle/toggle.service';
import { VideoService } from '../../services/video/video.service';
import { MatMenuModule } from '@angular/material/menu';
import { MediasoupService } from '../../services/mediasoup/mediasoup.service';
import { MeetingService } from '../../services/meeting/meeting.service';
@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatRippleModule, MatMenuModule],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss'
})
export class ToolbarComponent {
  // 메뉴 모드
  toggle_mode: string = '';

  // 화면 공유 모드
  toggle_screen_share: boolean = false;

  // 문서 모드
  toggle_video_whiteboard: string = '';

  // 비디오 디바이스 리스트
  video_list: Array<any> = [];

  // 오디오 디바이스 리스트
  audio_list: Array<any> = [];

  now_video: string = '';
  now_audio: string = '';

  toggle_video: boolean = false;
  toggle_audio: boolean = false;

  meeting_title: string = '';

  constructor(
    private toggleService: ToggleService,
    private videoService: VideoService,
    private mediasoupService: MediasoupService,
    private meetingService: MeetingService) {
    // effect for toggleService
    effect(() => {
      this.toggle_mode = this.toggleService.toggle_mode();
      this.toggle_screen_share = this.toggleService.toggle_screen_share();
      this.toggle_video_whiteboard = this.toggleService.toggle_video_whiteboard();
      this.toggle_video = this.toggleService.toggle_video();
      this.toggle_audio = this.toggleService.toggle_audio();
    })

    // effect for videoService
    effect(() => {
      this.video_list = this.videoService.videoDeivces();
      this.audio_list = this.videoService.audioDevices();

      this.now_audio = this.videoService.nowAudioId();
      this.now_video = this.videoService.nowVideoId();
    })

    // effect for meetingService
    effect(() => {
      this.meeting_title = this.meetingService.meeting_info().meetingTitle;
    })
  }

  // 오른쪽 메뉴 토글 바꾸기
  changeToggleMode(mode: string) {
    if (this.toggle_mode == mode) {
      mode = 'close';
    }

    this.toggleService.toggle_mode.set(mode);
  }

  // 화면 공유
  screenShare() {
    this.toggleService.toggle_screen_share.set(!this.toggle_screen_share)

    if (!this.toggle_screen_share) {
      this.mediasoupService.produce('screenType')
    } else {
      this.mediasoupService.closeProducer('screenType')
    }
  }

  // 비디오 모드, 문서 모드 변경
  changeVideoDocument(mode: string) {
    this.toggleService.toggle_video_whiteboard.set(mode);

    // 문서 모드이면
    if (mode == 'document') {
      const stream = this.videoService.presentVideoStream();

      this.videoService.presentVideoStream.set(undefined)
      this.videoService.audienceVideoStream.set([stream, ...this.videoService.audienceVideoStream()])
    } else {
      // 아니면
      let temp_audience = this.videoService.audienceVideoStream()
      const stream = temp_audience.shift();

      this.videoService.presentVideoStream.set(stream)
      this.videoService.audienceVideoStream.set([...temp_audience])
    }
  }


  // 마이크 선택
  selectAudio(deviceId: string) {
    this.videoService.nowAudioId.set(deviceId);
  }

  // 비디오 카메라 선택
  async selectVideo(deviceId: string) {
    if (deviceId != this.now_video && this.toggle_video) {
      this.videoService.nowVideoId.set(deviceId);

      this.mediasoupService.closeProducer('videoType')

      setTimeout(() => {
        this.mediasoupService.produce('videoType')
      }, 1)
    } else {
      this.videoService.nowVideoId.set(deviceId);

      this.mediasoupService.closeProducer('audioType')

      setTimeout(() => {
        this.mediasoupService.produce('audioType')
      }, 1)
    }
  }



  // 비디오 끄기 켜기
  async toggleVideo() {
    this.toggleService.toggle_video.set(!this.toggle_video);

    if (!this.toggle_video) {
      // this.videoService.getUserVideo(this.now_video);
      this.mediasoupService.produce('videoType')
    } else {
      this.mediasoupService.closeProducer('videoType')
    }
  }

  async toggleAudio() {
    this.toggleService.toggle_audio.set(!this.toggle_audio);

    if (!this.toggle_audio) {
      this.mediasoupService.produce('audioType')
    } else {
      this.mediasoupService.closeProducer('audioType')
    }
  }
}
