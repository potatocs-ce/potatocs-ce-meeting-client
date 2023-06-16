import { Component, ElementRef, OnInit, QueryList, ViewChildren } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { EventBusService } from 'src/@wb/services/eventBus/event-bus.service';
import { EventData } from 'src/@wb/services/eventBus/event.class';
import { MeetingInfoService } from 'src/@wb/store/meeting-info.service';
import { MeetingService } from 'src/app/services/meeting/meeting.service';
import { SocketioService } from '../../../services/socketio/socketio.service';

@Component({
    selector: 'app-participant',
    templateUrl: './participant.component.html',
    styleUrls: ['./participant.component.scss']
})
export class ParticipantComponent implements OnInit {

    private unsubscribe$ = new Subject<void>();
    private socket;


    participants = []; // 현재 접속 중인 참여자

    meetingInfo;

    public meetingId;
    public userId;
    public currentMembers;
    public myRole;
    public meetingStatus = false;

    whiteBoardMode = false;

    @ViewChildren('enlistedMember_span') public enlistedMember_spanRef: QueryList<ElementRef>;

    constructor(
        private eventBusService: EventBusService,
        private meetingInfoService: MeetingInfoService,
        private meetingService: MeetingService,
        private socketService: SocketioService,
    ) {
        this.socket = socketService.socket;
    }



    ngOnInit(): void {
        // 실시간으로 meeitngInfo를 바라보고 있다.
        this.meetingInfoService.state$
            .pipe(takeUntil(this.unsubscribe$)).subscribe((meetingInfo) => {
                this.meetingInfo = meetingInfo
                if (meetingInfo) {
                    console.log('[[ meetingInfo ]]', meetingInfo)
                    this.meetingId = meetingInfo._id;
                    this.userId = meetingInfo.userData._id;
                }
            });

        /////////////////////////////////////////////////////////////
        // DB currentMembers 정보 (online, role) 가져오기
        this.getParticipantState();
        /////////////////////////////////////////////////////////////


        /////////////////////////////////////////////////////////////
        // 자신의 role 업데이트 시 자신을 제외한 같은 room (meetingId로 판단)에 있는 사람들 role 업데이트
        this.socket.on('refreshRole', () => {
            this.getParticipantState();
        })
        /////////////////////////////////////////////////////////////


        /////////////////////////////////////////////////////////////
        // meeting status가 'Close'일 경우 role 변경 버튼 안보이게 해서 role 변경 금지
        this.eventBusService.on('Close', this.unsubscribe$, async () => {
            this.meetingStatus = true;
        })
        /////////////////////////////////////////////////////////////


        this.eventBusService.on('whiteBoardClick', this.unsubscribe$, () => {
            console.log('eventBus on whiteBoardClick')
            if (this.whiteBoardMode == false) {
                this.whiteBoardMode = true;
            } else {
                this.whiteBoardMode = false
            }
        })
    }


    ngOnDestory(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }




    ngAfterViewInit(): void {
        /////////////////////////////////////////////////////////////
        // 새로운 참여자가 들어오면 실시간 체크 online: false -> true
        this.eventBusService.on('updateParticipants', this.unsubscribe$, async (userId) => {

            this.participants = Object.keys(userId);

            // userId와 meetingId를 이용하여 on/offLine 판단
            const userOnlineData = {
                meetingId: this.meetingId,
                userId: this.participants
            }

            // 새로 들어온 참여자들 online: false -> true로 findOneAndUpdate
            this.meetingService.getOnlineTrue(userOnlineData).subscribe(() => {

                // DB currentMembers 정보 (online, role) 가져오기
                this.getParticipantState();
            })
        })
        /////////////////////////////////////////////////////////////


        /////////////////////////////////////////////////////////////
        // 참여자가 나갈 때 체크 online: true -> false
        this.eventBusService.on("participantLeft", this.unsubscribe$, (data) => {

            // userId와 meetingId를 이용하여 on/offLine 판단
            const userOnlineData = {
                meetingId: this.meetingId,
                userId: data.userId  // userId
            }

            // 새로 들어온 참여자들 online: false로 findOneAndUpdate
            this.meetingService.getOnlineFalse(userOnlineData).subscribe(() => {

                console.log(userOnlineData)
                // DB currentMembers 정보 (online, role) 가져오기
                this.getParticipantState();
            })

            // 참여자가 나가면 role: 'Presenter'로 초기화
            const userRoleData = {
                meetingId: this.meetingId,
                userId: data.userId,
                role: 'Presenter'
            }

            this.meetingService.getRoleUpdate(userRoleData).subscribe(() => {
            })
        })
        /////////////////////////////////////////////////////////////


        /////////////////////////////////////////////////////////////
        // 새로고침 시 role: Presenter로 초기화
        const userRoleData = {
            meetingId: this.meetingId,
            userId: this.userId,
            role: 'Presenter'
        }

        this.meetingService.getRoleUpdate(userRoleData).subscribe(() => {
            this.getParticipantState();
        })
        /////////////////////////////////////////////////////////////


        /////////////////////////////////////////////////////////////
        // 참여자 online / offline 실시간 체크
        this.socket.on("updateParticipants", (data) => {
            this.getParticipantState();
        })
        /////////////////////////////////////////////////////////////

        this.socket.on("disconnect", (data) => {
            this.getParticipantState();
        })
    }




    /////////////////////////////////////////////////////////////
    // DB currentMembers 정보 (online, role) 가져오기
    getParticipantState() {
        const meetingId = this.meetingId
        this.meetingService.getParticipantState({ meetingId }).subscribe((data) => {
            this.currentMembers = [];

            this.currentMembers = data[0].currentMembers // console [{…}, {…}, {…}, {…} ...] 

            // [DB currentMembers 정보에는 본인 name이 없기 때문에 member_id와 매칭해서 이름을 넣어주는 부분]
            /* *************************************************************************
             * meetingInfo.enlistedMembers와 현재 currentMembers의 userId값 비교 후 
             * 같은 userId를 찾으면 currentMembers[index]에 본인의 이름을 추가해준다.
             * ex) name: 'testuser1' 
             * **************************************************************************/
            this.meetingInfo.enlistedMembers.forEach((enlistedMembers, index) => {
                this.currentMembers.forEach(currentMembers => {
                    if (enlistedMembers._id == currentMembers.member_id) {
                        this.currentMembers[index].name = this.meetingInfo.enlistedMembers[index].name
                    }
                });
            });


            /////////////////////////////////////////////////////////////
            // 현재 접속 중인 참여자 수 구하기
            var currentMembersCount: number = 0;
            this.currentMembers.forEach((currentMembers) => {
                if (currentMembers.online == true) {
                    currentMembersCount += 1; // online: true일 경우 ++
                }
            });

            this.eventBusService.emit(new EventData('currentMembersCount', currentMembersCount));
            /////////////////////////////////////////////////////////////
        })
    }
    /////////////////////////////////////////////////////////////



    /////////////////////////////////////////////////////////////
    // role 변경
    chooseRole(role, i) {
        this.currentMembers[i].role = role;

        const userRoleData = {
            meetingId: this.meetingId,
            userId: this.userId,
            role: role
        }

        // userId와 meetingId를 이용하여 role 업데이트
        this.meetingService.getRoleUpdate(userRoleData).subscribe(() => {

            // 본인 role 업데이트 시 같은 room의 다른 사람도 실시간으로 상대방 role 업데이트
            this.socket.emit('roleUpdate', this.meetingId);

            // Participant로 변경 시 본인 state만 찾아서 Participant일 경우 권한 막기 ngClass 변경
            this.currentMembers.forEach((element, index) => {
                if (element.member_id == this.userId) {
                    const data = {
                        role: element.role
                    }
                    this.myRole = data;

                    // myRole이 Participant 일 경우 ngClass 변경(권한 막기)
                    this.eventBusService.emit(new EventData('myRole', data));
                }
            });
        })
    }
    /////////////////////////////////////////////////////////////
}

