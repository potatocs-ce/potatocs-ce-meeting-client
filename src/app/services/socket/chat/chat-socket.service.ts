import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { MeetingService } from '../../meeting/meeting.service';

@Injectable({
  providedIn: 'root'
})
export class ChatSocketService {

  constructor(private socket: Socket, private meetingService: MeetingService) {
    this.socket.on('receiveChatData', (chatData: any) => {
      console.log('우히... 우히히...')
      meetingService.meeting_chat_info.set([...this.meetingService.meeting_chat_info(), chatData])
    })
  }

  sendChat(data: any) {
    data.room_id = this.meetingService.meeting_room_id();
    this.socket.emit('sendChat', data, async (chatData: any) => {
      this.meetingService.meeting_chat_info.set([...this.meetingService.meeting_chat_info(), chatData])
    });
  }


}
