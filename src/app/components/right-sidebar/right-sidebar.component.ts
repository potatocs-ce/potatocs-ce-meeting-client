import { AfterViewInit, Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { EventBusService } from 'src/@wb/services/eventBus/event-bus.service';
import { MeetingInfoService } from 'src/@wb/store/meeting-info.service';


import { SocketioService } from '../../services/socketio/socketio.service';


@Component({
    selector: 'app-right-sidebar',
    templateUrl: './right-sidebar.component.html',
    styleUrls: ['./right-sidebar.component.scss']
})
export class RightSidebarComponent implements OnInit, AfterViewInit {

    private unsubscribe$ = new Subject<void>();

    whiteBoardMode = false;

    participants = []; // 현재 접속 중인 참여자
    enlistedMembers = []; // 미팅에 허가 된 멤버들
    enlistedMember_check = []; // li의 이름들을 담은 배열
    checkName = []; // li(enlistedMember)와 현재 접속 중인 참여자 비교할 배열

    @ViewChildren('enlistedMember_span') public enlistedMember_spanRef: QueryList<ElementRef>;

    selectedIndex = 0;
    currentMembersCount;

    private socket;

    constructor(
        private eventBusService: EventBusService,
        private meetingInfoService: MeetingInfoService,
        private socketService: SocketioService,
    ) {
        this.socket = socketService.socket;
    }

    ngOnInit(): void {
        this.selectedIndex = 0;

        this.eventBusService.on('whiteBoardClick', this.unsubscribe$, () => {
            console.log('eventBus on whiteBoardClick')
            if (this.whiteBoardMode == false) {
                this.whiteBoardMode = true;
            } else {
                this.whiteBoardMode = false
            }
        })


        // 현재 접속 중인 참여자 수 구하기
        this.eventBusService.on("currentMembersCount", this.unsubscribe$, (data) => {
            console.log(data)
            this.currentMembersCount = data;
        })
    }


    ngAfterViewInit(): void {

        //   /***************************************************************
        //   *  1.     
        //   *  this.enlistedMember_spanRef.toArray()와 현재 접속중인 참여자
        //   *  이름 교집합 찾아서 enlistedMember_check 배열에 담기                       
        //   *****************************************************************/
        //   this.enlistedMember_spanRef.toArray().forEach(element => {

        //     const innerText = element.nativeElement.innerText    
        //     this.enlistedMember_check.push(innerText)     

        //     console.log(this.enlistedMember_check)
        //   })

        //   // 새로운 참여자가 들어오면
        //   this.eventBusService.on('updateParticipants', this.unsubscribe$, async (userName) => {
        //     console.log(userName)

        //     this.participants = Object.keys(userName);

        //     /*************************************************************** 
        //     *  2.    
        //     *  this.enlistedMember_spanRef.toArray()와 현재 접속중인 참여자
        //     *  이름 교집합 찾아서 checkName 배열에 담기                       
        //     *****************************************************************/
        //     this.checkName = this.enlistedMember_check.filter(userName => this.participants.includes(userName))

        //     // 교집합 결과
        //     console.log(this.checkName)


        //     /***************************************************************   
        //     *  3. 
        //     *  this.enlistedMember_spanRef.toArray()에서 이름 교집합을 찾아서
        //     *  값이 있으면 클레스네임 추가                      
        //     *****************************************************************/
        //     this.enlistedMember_spanRef.toArray().forEach(element => {
        //       const innerText = element.nativeElement.innerText // 이름
        //       const span = element.nativeElement // element <span></span>

        //       // 교집합과 li.innerText와 비교하여 return 0, -1 
        //       const itemIndex = this.checkName.findIndex((item) => item === innerText);

        //       // 이름이 있으면 클레스 네임추가
        //       if (itemIndex >= 0) {
        //         span.className = "onLine"
        //       } else {
        //         span.className = "offLine"
        //       }
        //     })
        //   })


        // /***************************************************************
        // *  1.     
        // *  this.enlistedMember_spanRef.toArray()와 현재 접속중인 참여자
        // *  이름 교집합 찾아서 enlistedMember_check 배열에 담기                       
        // *****************************************************************/
        // this.enlistedMember_spanRef.toArray().forEach(element => {

        //     const innerText = element.nativeElement.innerText
        //     this.enlistedMember_check.push(innerText)

        //     // console.log(this.enlistedMember_check)
        // })


        // // 새로운 참여자가 들어오면
        // this.eventBusService.on('updateParticipants', this.unsubscribe$, async (userName) => {

        //     this.itemIndex = [];
        //     this.userName = userName;
        //     this.participants = Object.keys(userName);


        //     /*************************************************************** 
        //     *  2.    
        //     *  this.enlistedMember_spanRef.toArray()와 현재 접속중인 참여자
        //     *  이름 교집합 찾아서 checkName 배열에 담기                       
        //     *****************************************************************/
        //     this.checkName = this.enlistedMember_check.filter(userName => this.participants.includes(userName))

        //     /***************************************************************   
        //     *  3. 
        //     *  this.enlistedMember_spanRef.toArray()에서 이름 교집합을 찾아서
        //     *  값이 있으면 클레스네임 추가                      
        //     *****************************************************************/            
        //     await this.enlistedMember_spanRef.toArray().forEach(element => {
        //         const innerText = element.nativeElement.innerText // 이름
        //         const span = element.nativeElement // element <span></span>



        //         // 교집합과 li.innerText와 비교하여 return 0, -1 
        //         const itemIndex = this.checkName.findIndex((item) => item === innerText);

        //         this.itemIndex.push(itemIndex);

        //         // 이름이 있으면 클레스 네임추가
        //         for (let index = 0; index < this.itemIndex.length; index++){
        //             if (this.itemIndex[index] >= 0) {
        //                     return 'onLine'
        //                 } else {
        //                     return 'offLine'
        //                 }

        //         }
        //     })
        // })

    }

}
