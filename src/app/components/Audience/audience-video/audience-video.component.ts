import { CommonModule } from '@angular/common';
import { Component, Input, effect } from '@angular/core';
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



  goToPresent() {
    let audienceVideo = this.videoService.audienceVideoStream();

    const nowVideo = audienceVideo.findIndex((stream) => stream.id == this.id);

    const presentVideo = audienceVideo[nowVideo]
    audienceVideo.splice(nowVideo, 1)
    audienceVideo.unshift(this.videoService.presentVideoStream())

    this.videoService.audienceVideoStream.set(audienceVideo)
    this.videoService.presentVideoStream.set(presentVideo)

  }
}
