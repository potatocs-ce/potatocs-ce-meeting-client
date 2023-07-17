import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataStorageService {
  // 스트림. 스트림은 업로드된 정보를 저장하는곳.
  private meetingIdDataSubject = new BehaviorSubject({});
  // asObservable()를 사용해 스트림에 마지막으로 저장된 곳을 가리킴.
  meetingId = this.meetingIdDataSubject.asObservable();

  constructor() {}

  getMeetingId(data: any) {
    // 스트림을 마지막 곳에 업데이트
    // next는 스트림의 마지막 곳에 넣는다.
    // console.log('updatedData', profileData);
    this.meetingIdDataSubject.next(data);
  }
}
