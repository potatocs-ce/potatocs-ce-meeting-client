import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MeetingService {

  constructor() { }

  meeting_room_id = signal<string>('');
  meeting_room_title = signal<string>('');

  meeting_info = signal<any>(undefined);
}
