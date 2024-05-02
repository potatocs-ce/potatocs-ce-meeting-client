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


  // 방 채팅 정보 가져오기
  getMeetingChat(meetingId: string) {
    return this.http.get(this.baseUrl + '/meeting/getChat/' + meetingId);
  }


  getVideoDrawings(meetingId: string) {
    return this.http.get(this.baseUrl + '/meeting/getVideoDrawings/' + meetingId);
  }

  // 채팅 생성
  createChat(data: any) {
    return this.http.post(this.baseUrl + '/meeting/createChat', data);
  }
}
