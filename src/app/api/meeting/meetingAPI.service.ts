import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

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

  // 비디오 판서 정보 가져오기
  getVideoDrawings(meetingId: string) {
    return this.http.get(this.baseUrl + '/meeting/getVideoDrawings/' + meetingId);
  }

  // 특정 유저의 비디오 판서 클리어
  clearVideoDrawing(meetingId: string, userId: string) {
    return this.http.post(this.baseUrl + '/meeting/clearVideoDrawing', { meetingId, userId });
  }

  // 채팅 생성
  createChat(data: any, files: any) {
    const formData = new FormData();

    // 텍스트 데이터 추가
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        formData.append(key, data[key]);
      }
    }

    console.log(files)
    files.map((data: any, index: number) => {
      formData.append(`strings[${index}]`, JSON.stringify(data))
      formData.append('files', data.blob, `image${index}.png`)
    })

    return this.http.post(this.baseUrl + '/meeting/createChat', formData);
  }

  getChatImage(key: any) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/pdf',
      Accept: 'application/pdf',
    });
    return this.http.get(this.baseUrl + '/meeting/' + key, {
      headers: headers,
      responseType: 'blob',
    })
  }
}
