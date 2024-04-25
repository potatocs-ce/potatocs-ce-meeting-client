import { CommonModule } from '@angular/common';
import { Component, effect } from '@angular/core';
import { MeetingService } from '../../services/meeting/meeting.service';
import { MeetingServiceAPI } from '../../api/meeting/meetingAPI.service';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: './group.component.html',
  styleUrl: './group.component.scss'
})
export class GroupComponent {

  meetingInfo: any;

  currentMembers: any;
  currentMembersCount: any = 0;

  constructor(private meetingService: MeetingService, private meetingServiceAPI: MeetingServiceAPI) {

    // effect for meetingService 
    effect(() => {
      this.meetingInfo = this.meetingService.meeting_info();
      this.currentMembersCount = 0;
      this.currentMembers = this.meetingInfo.currentMembers;
      this.currentMembers.forEach((currentMember: any) => {
        if (currentMember.online == true) {
          this.currentMembersCount += 1; // online: true일 경우 ++
        }
      });
    })
  }


  ngOnInit() {

  }

  ngAfterViewInit() {

  }



  getParticipantState() {
    const meetingId = this.meetingService.meeting_room_id();
  }
}
