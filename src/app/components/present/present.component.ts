import { CommonModule } from '@angular/common';
import { Component, HostListener, effect } from '@angular/core';
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

  isWidth: boolean | undefined = undefined;

  constructor(private videoService: VideoService) {
    effect(() => {
      this.videoStream = this.videoService.presentVideoStream()
      // console.log(this.videoStream)
      if (this.videoStream == undefined) {
        const present: any = document.getElementById('present');

        present.style.width = '100%';
        present.style.height = '100%';
      }
    })
  }


  videoResize(target: any) {

    this.isWidth = undefined
    const present: any = document.getElementById('present');
    present.style.width = '100%';
    const present_section: any = document.getElementById('present_section');
    const pw = present.clientWidth;
    const ph = present_section.clientHeight;

    const vw = target.clientWidth;
    const vh = target.clientHeight;

    if (ph < vh + (pw - vw)) {
      // 세로가 길면
      target.style.height = `${ph}px`;
      target.style.width = 'auto';
      present.style.width = 'fit-content';
    } else {
      // 가로가 길면

      target.style.width = `${pw}px`;
      target.style.height = 'auto';
      present.style.height = 'fit-content';
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    const video_target: any = document.getElementById('present_video');

    this.videoResize(video_target)
  }
}
