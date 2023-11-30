import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { EventBusService } from 'src/@wb/services/eventBus/event-bus.service';
import { MeetingInfoService } from 'src/@wb/store/meeting-info.service';

import { EventData } from 'src/app/services/eventBus/event.class';
import { MeetingService } from 'src/app/services/meeting/meeting.service';
import { SocketioService } from 'src/app/services/socketio/socketio.service';


@Component({
    selector: 'app-meeting-chat',
    templateUrl: './meeting-chat.component.html',
    styleUrls: ['./meeting-chat.component.scss']
})
export class MeetingChatComponent implements OnInit, AfterViewChecked {

    private socket;
    private unsubscribe$ = new Subject<void>();
    whiteBoardMode = false;

    public chatInMeeting = [];
    public meetingTitle;
    public meetingId;
    public userId;
    public userName;
    public chatContent;

    meetingStatus: any;
    myChat = false;
    myRole: any;

    @ViewChild('target') private myScrollContainer: ElementRef;
    scrolltop: number = null;

    constructor(
        private socketService: SocketioService,
        private meetingInfoService: MeetingInfoService,
        private meetingService: MeetingService,
        private eventBusService: EventBusService,
    ) {
        this.socket = socketService.socket;
    }

    ngOnInit(): void {

        // 현재 meeting에 접속 중인 유저정보, 미팅정보 가져오기
        this.meetingInfoService.state$
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((meetingInfo) => {
                if (meetingInfo) {
                    console.log(meetingInfo)
                    this.meetingTitle = meetingInfo.meetingTitle;
                    this.meetingId = meetingInfo._id;
                    this.userId = meetingInfo.userData._id;
                    this.userName = meetingInfo.userData.name;
                }
            });

        this.eventBusService.on('meetingStatus', this.unsubscribe$, (meetingStatus) => {
            this.meetingStatus = meetingStatus.status
        })

        /*-------------------------------------------
                role에 따라 권한 설정
        ---------------------------------------------*/
        this.eventBusService.on('myRole', this.unsubscribe$, (myRole) => {
            console.log(myRole)
            this.myRole = myRole.role
        })


        // 새로 들어온 사람 채팅 데이터 받기 위해
        this.getMeetingChat();

        // socket에서 받아온 채팅 data
        this.socket.on('receiveChatData', (chatData) => {
            // 받아온 채팅 객체 배열에 넣기
            this.chatInMeeting.push(chatData)
        });

        // 지운 사람 외 같은 room 사람들 채팅 실시간 삭제
        this.socket.on('refreshChat', () => {
            this.getMeetingChat();
        })


        this.eventBusService.on('whiteBoardClick', this.unsubscribe$, () => {
            console.log('eventBus on whiteBoardClick')
            if (this.whiteBoardMode == false) {
                this.whiteBoardMode = true;
            } else {
                this.whiteBoardMode = false
            }
        })

    }

    // 마지막 채팅에 스크롤 focus
    ngAfterViewChecked() {
        this.scrollToBottom();
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    handleSharingClick() {
        // Participant 모드 일 경우 화면공유 기능 제외
        if (this.myRole != 'Participant') {
            this.eventBusService.emit(new EventData('handleSharingClick', ''))

            // this.sharing default -> false
            // 화면 공유 x -> 화면 공유  o
            if (this.sharing) {
                this.shareIcon = 'screen_share' // 아이콘 변경
            }
        }
    }

    // 채팅 생성
    createChat() {

        const data = {
            meetingTitle: this.meetingTitle,
            meetingId: this.meetingId,
            userId: this.userId,
            chatMember: this.userName,
            chatContent: this.chatContent
        }

        // data를 자신을 포함하여 socket emit
        this.meetingService.createChat(data).subscribe((data) => {
            this.socket.emit('sendChat', data);
        })

        this.chatContent = '';
    }


    // 늦게 들어온 사람도 현재까지 대화 불러오기
    getMeetingChat() {
        // meetingId로 판단하여 db에 있는 채팅 정보 가져오기
        const meetingId = this.meetingId
        this.meetingService.getMeetingChat({ meetingId }).subscribe((meetingChat) => {
            // 배열 초기화 시킨 뒤
            this.chatInMeeting = [];
            // Object로 와서 value 값만 뽑아내고
            var chat = Object.values(meetingChat);
            // 배열의 길이만큼 chatInMeeting[] 안에 넣어준다.
            chat.forEach(element => {
                // 받아온 채팅 객체 배열에 넣기
                this.chatInMeeting.push(element)
            });
        })
    }


    // 본인 채팅 지우기
    deleteChat(chatId) {
        this.meetingService.deleteMeetingChat({ chatId }).subscribe(async (data: any) => {
            console.log(data)
            // 채팅을 지운 뒤 db에 있는 채팅정보 다시 불러오기
            await this.getMeetingChat();
            console.log(this.meetingId);

            // 내가 지우면 같은 room의 다른 사람도 실시간으로 채팅 삭제
            this.socket.emit('deleteChat', this.meetingId);

        },
            (err: any) => {
                console.log(err);
            })
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
