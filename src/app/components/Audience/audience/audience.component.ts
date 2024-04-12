import { CommonModule } from '@angular/common';
import { Component, effect } from '@angular/core';
import { VideoService } from '../../../services/video/video.service';
import { AudienceVideoComponent } from '../audience-video/audience-video.component';

@Component({
  selector: 'app-audience',
  standalone: true,
  imports: [CommonModule, AudienceVideoComponent],
  templateUrl: './audience.component.html',
  styleUrl: './audience.component.scss'
})
export class AudienceComponent {
  videoList: Array<any> = [];
  constructor(private videoService: VideoService) {
    effect(() => {
      this.videoList = this.videoService.audienceVideoStream();
    })
  }

}
