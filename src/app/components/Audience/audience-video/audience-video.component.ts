import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, ViewChild, effect, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { VideoService } from '../../../services/video/video.service';
import { VideoDrawingService } from '../../../services/socket/video_drawing/video-drawing.service';
import { DrawingService } from '../../../services/drawing/drawing.service';
import { ToggleService } from '../../../services/toggle/toggle.service';
import { MeetingService } from '../../../services/meeting/meeting.service';

@Component({
  selector: 'app-audience-video',
  standalone: true,
  imports: [CommonModule, MatMenuModule, MatButtonModule, MatIconModule],
  templateUrl: './audience-video.component.html',
  styleUrl: './audience-video.component.scss'
})
export class AudienceVideoComponent {
  @ViewChild('targetVideo') target_video: ElementRef | undefined;

  videoHeight: number = 135;

  toggle_video_whiteboard: string = '';

  zoomScale: number = 1;


  @Input() stream: any = '';
  @Input() name: any = '';
  @Input() id: any = '';
  @Input() socket_id: any = '';
  @Input() user_id: any = '';
  @Input() screen: any = '';
  @Input() profile: any = undefined;

  constructor(
    private videoService: VideoService,
    private videoDrawingService: VideoDrawingService,
    private drawingService: DrawingService,
    private toggleService: ToggleService,
    private meetingService: MeetingService) {
    effect(() => {
      this.meetingService.users_info();
      if (this.meetingService.users_info().length) {
        if (!this.stream) return
        const elem: any = document.getElementsByClassName(this.id)[0];
        elem.playsInline = true;
        elem.autoplay = true;
        elem.muted = true;
      }
    })

    effect(() => {
      this.toggle_video_whiteboard = this.toggleService.toggle_video_whiteboard()
    })


  }






  goToPresent() {
    let audienceVideo = this.meetingService.users_info();


    const nowVideo = audienceVideo.findIndex((stream: any) => stream.id == this.id);

    const presentVideo = audienceVideo[nowVideo];
    audienceVideo.splice(nowVideo, 1);
    audienceVideo.unshift(this.meetingService.present_user_info());

    this.meetingService.users_info.set(audienceVideo);
    this.meetingService.present_user_info.set(presentVideo);
  }

  videoResize(target: any) {

    let zoomScale = 1;

    // 비디오 해상도 계산
    const aspectRatio = target.videoWidth / target.videoHeight;
    // 새로운 세로 높이 계산
    const newHeight = 320 / aspectRatio;


    this.zoomScale = this.videoHeight / newHeight * zoomScale;

    target.style.height = `${this.videoHeight}px`;

  }
}
