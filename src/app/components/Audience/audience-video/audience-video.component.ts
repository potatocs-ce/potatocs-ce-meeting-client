import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, ViewChild, effect } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { VideoService } from '../../../services/video/video.service';

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

  constructor(private videoService: VideoService,) {
    effect(() => {
      // this.videoService.audienceVideoStream();
      if (this.videoService.audienceVideoStream().length) {
        const elem: any = document.getElementsByClassName(this.id)[0];


        elem.playsInline = true;
        elem.autoplay = true;
        elem.muted = true;
      }

    })

  }

  @Input() stream: any = '';
  @Input() name: any = '';
  @Input() id: any = '';
  @Input() socket_id: any = '';
  @Input() user_id: any = '';



  goToPresent() {
    let audienceVideo = this.videoService.audienceVideoStream();

    const nowVideo = audienceVideo.findIndex((stream) => stream.id == this.id);

    const presentVideo = audienceVideo[nowVideo]
    audienceVideo.splice(nowVideo, 1)
    audienceVideo.unshift(this.videoService.presentVideoStream())

    this.videoService.audienceVideoStream.set(audienceVideo)
    this.videoService.presentVideoStream.set(presentVideo)
  }

  videoResize(target: any) {
    let zoomScale = 1;
    const data_canvas: any = this.data_canvas?.nativeElement;
    const data_context: any = data_canvas.getContext('2d');
    const target_canvas: any = this.target_canvas?.nativeElement;
    const target_context: any = target_canvas.getContext('2d');

    const canvas_container: any = document.getElementsByClassName('audience_canvas_container')[0];

    zoomScale = 170 / target.videoHeight * zoomScale;
    target.style.height = `170px`;
    console.log(canvas_container.clientWidth)
    data_canvas.width = canvas_container.clientWidth;
    data_canvas.height = canvas_container.clientHeight;
    target_canvas.width = canvas_container.clientWidth;
    target_canvas.height = canvas_container.clientHeight;

    // this.drawingService.end(data_context,
    //   this.videoDrawingService.drawVarArray(), { type: 'pen', color: 'red', width: '1' })


    target_context.setTransform(zoomScale, 0, 0, zoomScale, 0, 0)
    data_context.setTransform(zoomScale, 0, 0, zoomScale, 0, 0)
  }
}
