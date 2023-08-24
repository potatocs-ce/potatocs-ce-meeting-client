import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ApiService } from 'src/@wb/services/apiService/api.service';
import { EventBusService } from 'src/@wb/services/eventBus/event-bus.service';
import { SocketService } from 'src/@wb/services/socket/socket.service';
import { MeetingInfoService } from 'src/@wb/store/meeting-info.service';
import { DataStorageService } from 'src/app/services/dataStorage/data-storage.service';
import { EventData } from 'src/app/services/eventBus/event.class';
import { MeetingService } from 'src/app/services/meeting/meeting.service';


// notifier
import { NotifierService } from 'angular-notifier';
import { MatSnackBar } from '@angular/material/snack-bar';


@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  id;
  meetingId: any; // 회의 Object_id
  meetingData: any; // 회의와 참가자 정보
  whiteBoardMode = false;
  deviceCheckMode = false;
  private unsubscribe$ = new Subject<void>();
  private socket;

  userId: any;
  meetingClose = false;

  toggle = false;

  constructor(
    private eventBusService: EventBusService,
    private route: ActivatedRoute,
    private dataStorageService: DataStorageService,
    private apiService: ApiService,
    private meetingInfoService: MeetingInfoService,
    private socketService: SocketService,
    private meetingService: MeetingService,
    public notifier: NotifierService,
    private snackbar: MatSnackBar,
  ) {
    this.socket = this.socketService.socket;
    this.notifier = notifier;
  }

  ngOnInit(): void {


    // 실시간으로 meeitngInfo를 바라보고 있다.
    this.meetingInfoService.state$
      .pipe(takeUntil(this.unsubscribe$)).subscribe((meetingInfo) => {
        if (meetingInfo) {
          console.log('[[ meetingInfo ]]', meetingInfo)
          this.meetingId = meetingInfo._id;
          this.userId = meetingInfo.userData._id;
        }
      });


    this.meetingId = this.route.snapshot.params['id'];


    /////////////////////////////////////////////////////////////
    // Meeting status가 'Close'일 경우 모든 권한 제어
    this.getMeetingStatus(this.meetingId)
    /////////////////////////////////////////////////////////////


    /////////////////////////////////////////////
    // Meeting Info 수신
    // ---> 이 부분은 추후 화상회의 부분에서 적용해야 함
    ////////////////////////////////////////////////////////////////////
    if (this.meetingId) {
      this.socket.emit('join:room', this.meetingId);
    }
    // 화이트 보드 컴포넌트에 있는 this.apiService.getMeetingInfo 없애고
    // main.component에 저장해두기
    // 그런 다음 데이터를 subscribe 해서 webRTC 부분에 가져오기
    // 가져와야할 데이터 : userName, id, password는 없애고
    // 맴버리스트도 가져와서 particpants 수정? 


    this.eventBusService.on('whiteBoardClick', this.unsubscribe$, () => {
      console.log('eventBus on whiteBoardClick')
      if (this.whiteBoardMode == false) {
        this.whiteBoardMode = true;
      } else {
        this.whiteBoardMode = false
      }
    })

    this.eventBusService.on('deviceCheck', this.unsubscribe$, () => {
      console.log('eventBus on deviceCheck')
      if (this.deviceCheckMode == false) {
        this.deviceCheckMode = true;
      } else {
        this.deviceCheckMode = false
      }

    })

    this.eventBusService.on('toggle', this.unsubscribe$, () => {
      console.log('eventBus on toggle')
      if (this.toggle == false) {
        this.toggle = true;
      } else {
        this.toggle = false
      }
    })


    // 자기 자신 포함 같은 room에 있는 사람들에게 입장했다고 알림
    this.socket.on('notifier_in', (userName) => {
      // this.showNotification('info', `${userName} `);

      this.snackbar.open(userName, 'has entered.', {
        duration: 3000,
        horizontalPosition: "right",
        panelClass: ['entered-snackbar',],
      });
    })

    // // 자기 자신 포함 같은 room에 있는 사람들에게 퇴장했다고 알림
    this.socket.on('notifier_out', (userName) => {
      // console.log(userName)
      this.showNotification('info', `${userName} has left.`);

      this.snackbar.open(userName, 'has left.', {
        duration: 3000,
        horizontalPosition: "right",
        panelClass: ['left-snackbar',],

      });
    })

  }




  /////////////////////////////////////////////////////////////
  // Meeting status가 'Close'일 경우 모든 권한 제어
  getMeetingStatus(meetingId) {

    const data = {
      meetingId: meetingId
    }

    // meeting의 status를 불러온다.
    this.meetingService.getMeetingStatus(data).subscribe((res: any) => {

      this.eventBusService.emit(new EventData('meetingStatus', res))

      // meeting의 status가 'Close'일 경우 role 변경
      if (res.status === 'Close') {

        const userRoleData = {
          meetingId: this.meetingId,
          userId: this.userId,
          role: 'Participant'
        }

        this.meetingService.getRoleUpdate(userRoleData).subscribe(() => {
          const data = {
            role: 'Participant',
            status: res.status
          }

          this.eventBusService.emit(new EventData('myRole', data));
          // meeting status가 'Close'일 경우 role 변경 버튼 안보이게 해서 role 변경 금지
          this.eventBusService.emit(new EventData('Close', data));
        })
      }
    })
  }
  /////////////////////////////////////////////////////////////


  /**
* Show a notification
*
* @param {string} type    Notification type
* @param {string} message Notification message
*/
  // showNotification( type: string, message: string ): void {
  // 	this.notifier.notify( type, message );
  // }

  showNotification(type: string, message: string): void {
    this.notifier.notify(type, message);
  }

}
