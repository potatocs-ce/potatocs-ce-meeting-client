import { CommonModule } from '@angular/common';
import { Component, effect } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { ToggleService } from '../../services/toggle/toggle.service';
import { VideoService } from '../../services/video/video.service';
import { MatMenuModule } from '@angular/material/menu';
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

  constructor(private toggleService: ToggleService, private videoService: VideoService) {
    // effect for toggleService
    effect(() => {
      this.toggle_mode = this.toggleService.toggle_mode();
      this.toggle_screen_share = this.toggleService.toggle_screen_share();
      this.toggle_video_whiteboard = this.toggleService.toggle_video_whiteboard();
    })

    // effect for videoService
    effect(() => {
      this.video_list = this.videoService.videoDeivces();
      this.audio_list = this.videoService.audioDevices();
      this.now_video = this.videoService.nowVideoId();
      this.now_audio = this.videoService.nowAudioId();
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
  screen_share() {
    this.toggleService.toggle_screen_share.set(!this.toggle_screen_share)
  }

  // 비디오 모드, 문서 모드 변경
  change_video_document(mode: string) {
    this.toggleService.toggle_video_whiteboard.set(mode);
  }


  selectAudio(deviceId: string) {
    this.videoService.nowAudioId.set(deviceId);
  }

  selectVideo(deviceId: string) {
    this.videoService.nowVideoId.set(deviceId);
  }
}
