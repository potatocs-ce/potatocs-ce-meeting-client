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
  @ViewChild('data_canvas') data_canvas: ElementRef | undefined;
  @ViewChild('target_canvas') target_canvas: ElementRef | undefined;

  @ViewChild('targetVideo') target_video: ElementRef | undefined;

  videoHeight: number = 160;

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

    effect(() => {
      this.meetingService.skipList()
      untracked(() => {
        const data_canvas: any = this.data_canvas?.nativeElement;

        if (!data_canvas) return;

        const data_context: any = data_canvas.getContext('2d');

        data_context.clearRect(0, 0, data_canvas.width / this.zoomScale, data_canvas.height / this.zoomScale);
        this.videoDrawingService.drawVarArray()[this.user_id]?.forEach((data: any) => {
          if (data.screen == this.screen) {

            if (!this.meetingService.skipList().includes(data.userId)) {
              this.drawingService.end(data_context, data['drawingEvent'].points, data['drawingEvent'].tool)
            }
          }
        })
      })
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
    const data_canvas: any = this.data_canvas?.nativeElement;
    const data_context: any = data_canvas.getContext('2d');
    const target_canvas: any = this.target_canvas?.nativeElement;
    const target_context: any = target_canvas.getContext('2d');

    const canvas_container: any = document.getElementsByClassName('audience_canvas_container')[0];

    this.zoomScale = this.videoHeight / target.videoHeight * zoomScale;

    target.style.height = `${this.videoHeight}px`;

    data_canvas.width = canvas_container.clientWidth;
    data_canvas.height = canvas_container.clientHeight;
    target_canvas.width = canvas_container.clientWidth;
    target_canvas.height = canvas_container.clientHeight;

    target_context.setTransform(this.zoomScale, 0, 0, this.zoomScale, 0, 0)
    data_context.setTransform(this.zoomScale, 0, 0, this.zoomScale, 0, 0)

    this.videoDrawingService.drawVarArray()[this.user_id]?.forEach((data: any) => {
      if (data.screen == this.screen) {

        if (!this.meetingService.skipList().includes(data.userId)) {
          this.drawingService.end(data_context, data['drawingEvent'].points, data['drawingEvent'].tool)
        }
      }
    })
  }
}
