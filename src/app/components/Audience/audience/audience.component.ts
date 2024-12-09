import { CommonModule } from '@angular/common';
import { Component, effect } from '@angular/core';
import { VideoService } from '../../../services/video/video.service';
import { AudienceVideoComponent } from '../audience-video/audience-video.component';
import { ToggleService } from '../../../services/toggle/toggle.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MeetingService } from '../../../services/meeting/meeting.service';

@Component({
  selector: 'app-audience',
  standalone: true,
  imports: [CommonModule, AudienceVideoComponent, MatIconModule, MatButtonModule],
  templateUrl: './audience.component.html',
  styleUrl: './audience.component.scss'
})
export class AudienceComponent {
  videoList: Array<any> = [];
  constructor(private videoService: VideoService, public toggleService: ToggleService, private meetingService: MeetingService) {
    effect(() => {
      // this.videoList = this.videoService.audienceVideoStream();
      this.videoList = this.meetingService.users_info();

    })


  }



  toggleAudience() {
    this.toggleService.toggle_audience.set(!this.toggleService.toggle_audience())
  }
}
