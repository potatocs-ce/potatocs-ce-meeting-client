import { CommonModule } from '@angular/common';
import { Component, effect } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { VideoService } from '../../services/video/video.service';
@Component({
  selector: 'app-present',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: './present.component.html',
  styleUrl: './present.component.scss'
})
export class PresentComponent {

  videoStream: any = undefined;

  isWidth: boolean = true;

  constructor(private videoService: VideoService) {
    effect(() => {
      this.videoStream = this.videoService.presentVideoStream()
      console.log(this.videoStream)
      if (this.videoStream == undefined) {
        this.isWidth = true
      }
    })
  }


  videoResize(event: any) {
    const present_section: any = document.getElementById('present');
    const pw = present_section.clientWidth;
    const ph = present_section.clientHeight;

    const vw = event.target.clientWidth;
    const vh = event.target.clientHeight;

    // console.log(event.target.clientHeight, event.target.clientWidth, present_section.clientWidth)
    // 세로가 길면
    if (ph < vh + (pw + vw)) {
      this.isWidth = false;

    } else {
      // 가로가 길면
      this.isWidth = true;
    }
  }


}
