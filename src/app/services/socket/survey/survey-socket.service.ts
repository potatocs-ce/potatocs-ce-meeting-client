import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { SurveyApiService } from '../../../api/survey/survey-api.service';
import { SurveyService } from '../../survey/survey.service';
import { MeetingService } from '../../meeting/meeting.service';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class SurveySocketService {

  constructor(private socket: Socket,
    private surveyApiService: SurveyApiService,
    private surveyService: SurveyService,
    private meetingService: MeetingService,
    private authService: AuthService) {
    this.socket.on('updateSurveyList', (res: any) => {
      this.surveyService.surveys.set(res);
    })
  }

  updateSurvey() {


    this.socket.emit('updateSurveyList', { _id: this.meetingService.meeting_room_id(), userId: this.authService.getTokenInfo()._id }, (res: any) => {
      this.surveyService.surveys.set(res);
    })
  }
}
