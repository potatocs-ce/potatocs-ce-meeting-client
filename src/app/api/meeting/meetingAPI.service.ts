import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MeetingServiceAPI {

  private baseUrl = environment.apiUrl;


  constructor(private http: HttpClient) { }


  getMeetingInfo(data: any) {
    return this.http.get(this.baseUrl + '/meeting/meetingInfo/' + data);
  }


  // 참여자별 상태 정보 가져오기
  getParticipantState(meetingId: string) {
    return this.http.get(this.baseUrl + '/meeting/getParticipantState/' + meetingId);
  }
}
