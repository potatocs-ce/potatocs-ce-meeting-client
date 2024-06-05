import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { SurveyApiService } from '../../../api/survey/survey-api.service';
import { SurveyService } from '../../survey/survey.service';
import { MeetingService } from '../../meeting/meeting.service';

@Injectable({
  providedIn: 'root'
})
export class SurveySocketService {

  constructor(private socket: Socket, private surveyApiService: SurveyApiService, private surveyService: SurveyService, private meetingService: MeetingService) {
    this.socket.on('updateSurveyList', () => {
      console.log('진짜 뭐지')
      // 업데이트 됐으면 다시 api 요청
      this.surveyApiService.getSurveys(this.meetingService.meeting_room_id()).subscribe((res: any) => {
        this.surveyService.surveys.set(res);
      })
    })
  }

  updateSurvey() {
    this.socket.emit('updateSurveyList', this.meetingService.meeting_room_id(), () => {

    })
  }
}
