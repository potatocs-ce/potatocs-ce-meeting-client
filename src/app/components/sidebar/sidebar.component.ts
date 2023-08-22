import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { EventBusService } from 'src/@wb/services/eventBus/event-bus.service';
import { EventData } from 'src/app/services/eventBus/event.class';
import { ParticipantsService } from 'src/app/services/participants/participants.service';
import { SocketioService } from 'src/app/services/socketio/socketio.service';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {

    private unsubscribe$ = new Subject<void>();
    private socket;
    video: any;
    sharing = false;
    stream: any;
    shareIcon = 'screen_share';

    whiteBoardMode = false;
    whiteBoardMode1 = false;
    whiteBoardIcon = 'border_color';

    myRole: any;

    constructor(
        private socketService: SocketioService,
        private participantsService: ParticipantsService,
        private eventBusService: EventBusService,
    ) {
        this.socket = socketService.socket;
    }



    @ViewChild('sharingBtn') public sharingBtnRef: ElementRef;
    get sharingBtn(): HTMLButtonElement {
        return this.sharingBtnRef.nativeElement;
    }



    ngOnInit(): void {
        this.participantsService.updateUserName('now User')
        /*-------------------------------------------
                role에 따라 권한 설정
        ---------------------------------------------*/
        this.eventBusService.on('myRole', this.unsubscribe$, (myRole) => {
            this.myRole = myRole.role
        })

        // 공유 중인 화면 취소하여 내 로컬 화면 출력
        this.eventBusService.on('handleSharingCancel', this.unsubscribe$, () => {
            this.shareIcon = 'screen_share'
            this.sharing = false;
        })

        // 
        this.eventBusService.on('handleSharingStop', this.unsubscribe$, () => {
            this.shareIcon = 'stop_screen_share'
            this.sharing = true;
        })

        this.eventBusService.on('whiteBoardClick', this.unsubscribe$, () => {
            console.log('eventBus on whiteBoardClick')
            if (this.whiteBoardMode1 == false) {
                this.whiteBoardMode1 = true;
            } else {
                this.whiteBoardMode1 = false
            }
        })

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

    whiteBoardClick() {
        this.eventBusService.emit(new EventData('whiteBoardClick', ''))

        if (this.whiteBoardMode == false) {
            this.whiteBoardMode = true;
            console.log('whiteBoard Mode On')
            this.eventBusService.emit(new EventData('toggle', ''));
            this.whiteBoardIcon = 'desktop_mac'
        } else {
            this.whiteBoardMode = false
            console.log('whiteBoard Mode Off')
            this.eventBusService.emit(new EventData('toggle', ''));
            this.whiteBoardIcon = 'border_color'
        }


    }
}
