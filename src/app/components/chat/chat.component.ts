import { CommonModule } from '@angular/common';
import { Component, effect } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MeetingService } from '../../services/meeting/meeting.service';
import { MeetingServiceAPI } from '../../api/meeting/meetingAPI.service';
import { AuthService } from '../../services/auth/auth.service';
import { FormsModule } from '@angular/forms';
import { ChatSocketService } from '../../services/socket/chat/chat-socket.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent {
  chatContent: string = ''; // 사용자가 타이핑 하는 input 내용 변수

  chat_info: any;
  user_id: any;

  constructor(
    private meetingService: MeetingService,
    private meetingServiceApi: MeetingServiceAPI,
    private authService: AuthService,
    private chatSocketService: ChatSocketService
  ) {
    // chat_info
    effect(() => {
      this.chat_info = this.meetingService.meeting_chat_info()
    })

    this.user_id = this.authService.getTokenInfo()._id;
  }

  ngOnInit() {
    this.getMeetingChat();
  }

  // meetingId 로 db에 있는 채팅 정보 가져오기
  getMeetingChat() {
    this.meetingServiceApi.getMeetingChat(this.meetingService.meeting_room_id()).subscribe((res: any) => {
      this.meetingService.meeting_chat_info.set(res)
    })
  }

  // 채팅 보내기
  submitChat() {

    const data = {
      meetingId: this.meetingService.meeting_room_id(),
      userId: this.user_id,
      chatContent: this.chatContent
    }

    this.meetingServiceApi.createChat(data).subscribe((res) => {
      this.chatSocketService.sendChat(res);
    })

    this.chatContent = '';
  }
}
