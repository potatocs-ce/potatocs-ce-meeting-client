import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MeetingService {

  constructor() { }

  meeting_room_id = signal<string>('');
  meeting_room_title = signal<string>('');

  meeting_info = signal<any>(undefined);

  meeting_chat_info = signal<any>(undefined);


  // 판서 정보 안보여줄 데이터 변수
  skipList = signal<any>([]);
}
