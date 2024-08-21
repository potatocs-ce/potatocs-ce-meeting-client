import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, ViewEncapsulation, effect } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MeetingService } from '../../services/meeting/meeting.service';
import { MeetingServiceAPI } from '../../api/meeting/meetingAPI.service';
import { AuthService } from '../../services/auth/auth.service';
import { FormsModule } from '@angular/forms';
import { ChatSocketService } from '../../services/socket/chat/chat-socket.service';
import { MatDialog } from '@angular/material/dialog';
import { AddCaptureDialogComponent } from '../dialogs/add-capture-dialog/add-capture-dialog.component';
import { DialogService } from '../../services/dialog/dialog.service';
import { StackImageService } from '../../services/stackImage/stack-image.service';
import { DrawingService } from '../../services/drawing/drawing.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
  encapsulation: ViewEncapsulation.None // 스타일이 전역으로 적용됨
})
export class ChatComponent {
  chatContent: string = ''; // 사용자가 타이핑 하는 input 내용 변수

  chat_info: any;
  user_id: any;

  card_divs: any = [];

  @ViewChild('target') private myScrollContainer: ElementRef | any;

  constructor(
    private meetingService: MeetingService,
    private meetingServiceApi: MeetingServiceAPI,
    private authService: AuthService,
    private chatSocketService: ChatSocketService,
    private dialogService: DialogService,
    public stackImageService: StackImageService,
    private drawingService: DrawingService
  ) {
    // chat_info
    effect(() => {
      this.chat_info = this.meetingService.meeting_chat_info();

      setTimeout(() => {
        this.scrollToBottom();
      })

    })

    effect(() => {

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

    this.meetingServiceApi.createChat(data).subscribe((res) => {
      this.chatSocketService.sendChat(res);
    })

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

  handleResizeHeight(textarea: any): void {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  openScreenCaptureDialog(): void {
    this.dialogService.openCaptureDialog().subscribe((res: any) => {
      // 스크린 캡쳐 다이어로그에서 넘어온 데이터가 있으면 이미지를 스택에 넣음
      if (res) {
        this.stackImageService.imageStack.update((data: any) => {
          return [...data, res]
        })

        const div: any = document.createElement('div');
        div.className = 'div_card'

        const img: any = document.createElement("img");
        img.src = res.dataURL;
        img.height = 50;


        const canvas: any = document.createElement('canvas');
        canvas.height = 50;
        canvas.width = res.width * (50 / res.height);

        const context: any = canvas.getContext('2d');
        const zoomScale = 50 / res.height;


        context.setTransform(zoomScale, 0, 0, zoomScale, 0, 0)
        res.drawingDatas.forEach((data: any) => {
          this.drawingService.end(context, data.points, data.tool)
        })

        div.appendChild(img);
        div.appendChild(canvas);

        document.getElementsByClassName('image_section')[0].appendChild(div);
        // document.getElementById(`imgby${this.stackImageService.imageStack().length - 1}`)?.parentElement?.appendChild(canvas)
      }
    })
  }
}
