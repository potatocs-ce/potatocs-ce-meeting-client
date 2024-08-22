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
        // stack에 데이터 추가
        this.stackImageService.imageStack.update((data: any) => {
          return [...data, res]
        })
        // div 생성 아래의 img, canvas 등을 담을 틀
        const div: any = document.createElement('div');
        // 클래스 이름 지정
        div.className = 'div_card'
        // width는 height가 50px일 경우 width 비율 계산해서 결정
        div.style.width = res.width * (50 / res.height) + 'px';
        // img 생성
        const img: any = document.createElement("img");
        // data 지정
        img.src = res.dataURL;
        // height 는 50px
        img.height = 50;

        // canvas 생성
        const canvas: any = document.createElement('canvas');
        // height는 50px 고정
        canvas.height = 50;
        // width 는 height랑 비율 맞춰서 지정
        canvas.width = res.width * (50 / res.height);

        // getContext 
        const context: any = canvas.getContext('2d');
        // 50px 로 줄어들면 얼마나 줄어든건지 계산
        const zoomScale = 50 / res.height;

        // canvas 스케일 변경 젹용
        context.setTransform(zoomScale, 0, 0, zoomScale, 0, 0)
        // 그림 그리기
        res.drawingDatas.forEach((data: any) => {
          this.drawingService.end(context, data.points, data.tool)
        })





        // mat-icon 요소로 추가 (아이콘 )
        const deleteButton: any = document.createElement('mat-icon');
        // 처음 deleteButton, 제일 마지막거 왜에는 필수 class
        deleteButton.className = `deleteButton mat-icon material-icons notranslate material-symbols-outlined mat-icon-no-color ${this.stackImageService.imageStack().length - 1}`;
        // 태그 내부에 cancel입력
        deleteButton.innerHTML = 'cancel'
        // 속성 요소롤 fontSet 지정
        deleteButton.setAttribute("fontSet", 'material-symbols-outlined');
        // 지우기 버튼을 클릭하면....
        deleteButton.addEventListener('click', (event: any) => {
          // 클래스 이름에 심어져 있는 순서 가져오기
          const classList = event.currentTarget.className.split(' ')
          // 실질적 데이터 제거
          this.stackImageService.imageStack.update((data: any) => {
            data.splice(classList[classList.length - 1], 1);
            return data;
          })
          // 화면에서 보이는 부분 제거
          event.currentTarget.parentElement.remove();
        })

        // 이미지 붙이기
        div.appendChild(img);
        // canvas 붙이기
        div.appendChild(canvas);
        // 지우기 버튼 붙이기
        div.appendChild(deleteButton)

        // 마지막 요소에 하나 추가하기
        document.getElementsByClassName('image_section')[0].appendChild(div);
        // document.getElementById(`imgby${this.stackImageService.imageStack().length - 1}`)?.parentElement?.appendChild(canvas)
      }
    })
  }
}
