import { CommonModule } from '@angular/common';
import { Component, effect } from '@angular/core';
import { MeetingService } from '../../services/meeting/meeting.service';
import { MeetingServiceAPI } from '../../api/meeting/meetingAPI.service';

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './group.component.html',
  styleUrl: './group.component.scss'
})
export class GroupComponent {

  meetingInfo: any;
  constructor(private meetingService: MeetingService, private meetingServiceAPI: MeetingServiceAPI) {

    // effect for meetingService 
    effect(() => {
      this.meetingInfo = this.meetingService.meeting_info();
    })
  }


  ngOnInit() {

  }



  getParticipantState() {
    // const meetingId = this.meetingServiceAPI.
  }
}
