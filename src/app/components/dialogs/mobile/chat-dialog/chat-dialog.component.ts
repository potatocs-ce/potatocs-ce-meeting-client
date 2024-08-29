import { CommonModule } from '@angular/common';
import { Component, effect, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MeetingService } from '../../../../services/meeting/meeting.service';
import { MeetingServiceAPI } from '../../../../api/meeting/meetingAPI.service';
import { AuthService } from '../../../../services/auth/auth.service';
import { ChatSocketService } from '../../../../services/socket/chat/chat-socket.service';

@Component({
  selector: 'app-chat-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
  templateUrl: './chat-dialog.component.html',
  styleUrl: './chat-dialog.component.scss'
})
export class ChatDialogComponent {
  chatContent: string = ''; // 사용자가 타이핑 하는 input 내용 변수

  chat_info: any;
  user_id: any;

  @ViewChild('target') private myScrollContainer: ElementRef | any;

  constructor(
    private meetingService: MeetingService,
    private meetingServiceApi: MeetingServiceAPI,
    private authService: AuthService,
    private chatSocketService: ChatSocketService
  ) {
    // chat_info
    effect(() => {
      this.chat_info = this.meetingService.meeting_chat_info();

      setTimeout(() => {
        this.scrollToBottom();
      })

    })

    this.user_id = this.authService.getTokenInfo()._id;
  }

  ngOnInit() {
    // this.getMeetingChat();
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

    // this.meetingServiceApi.createChat(data).subscribe((res) => {
    //   this.chatSocketService.sendChat(res);
    // })

    this.chatContent = '';
  }



  // 마지막 채팅에 스크롤 focus
  // http://daplus.net/scroll-angular-2-%EC%95%84%EB%9E%98%EB%A1%9C-%EC%8A%A4%ED%81%AC%EB%A1%A4-%EC%B1%84%ED%8C%85-%EC%8A%A4%ED%83%80%EC%9D%BC/
  scrollToBottom(): void {
    try {
      // this.scrolltop = this.myScrollContainer.nativeElement.scrollHeight;

      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;

    } catch (err) { }
  }
}
