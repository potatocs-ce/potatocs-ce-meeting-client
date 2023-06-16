import { Injectable, OnInit } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, ActivatedRoute } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { ApiService } from 'src/@wb/services/apiService/api.service';
import { SocketService } from 'src/@wb/services/socket/socket.service';
import { MeetingInfoService } from 'src/@wb/store/meeting-info.service';
import { DialogService } from 'src/app/components/auth/sign-in/dialog/dialog.service';
import { AuthService } from '../../auth/auth.service';
import { MeetingService } from '../meeting.service';

@Injectable()
export class MeetingGuard implements CanActivate, OnInit {

	userId: any; // userId
	enlistedMembers: any; // 회의 참가 멤버

	meetingId: any;
	private socket;
	constructor(
		private router: Router,
		private route: ActivatedRoute,
		private auth: AuthService,
		private meetingService: MeetingService,
		private apiService: ApiService,
		private meetingInfoService: MeetingInfoService,
		private socketService: SocketService,
        private dialogService: DialogService
	) {
		this.socket = this.socketService.socket;
	}

	ngOnInit() {
		console.log('auth redirect oninit');

	}

	async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {


		console.log(route.params['id'])

		// objectId 형식이 아니면 네이버로 이동
		// if(route.params['id'].length < 24){
		// 	window.location.href = 'https://naver.com/'
		// 	return false;
		// }


		// objectId 형식이 아니면 네이버로 이동
		// https://rxjs.dev/api/index/function/lastValueFrom
		// lastValueFrom 은 toPromise와 같다.
		try {
			const meetingInfo: any = await lastValueFrom(this.apiService.getMeetingInfo(route.params['id']))
			console.log(meetingInfo)

			this.userId = this.auth.getTokenInfo()._id;
			console.log(this.userId)
			if (this.userId) {
				const data: any = await this.meetingService.getUserData(this.userId).toPromise()
				console.log(data.userData)
				meetingInfo.userData = data.userData;

				this.meetingInfoService.setMeetingInfo(meetingInfo);
				// this.meetingInfoService.setMeetingInfo({userData});

				// meeting status 가 pending 일때
				if( meetingInfo.status == "pending"){
					this.dialogService.openDialogNegative("The host has not started the meeting yet.");
					this.router.navigate(['/sign-in'], {queryParams: {params : state.url} });
				}

				console.log(meetingInfo)
				console.log(meetingInfo.enlistedMembers)
				const index = meetingInfo.enlistedMembers.findIndex((item) =>
					item._id == this.userId
				)
				console.log(index)

				if (index < 0) {
					// id가 없을 경우 어디론가 보낸다.
					// alert("Don't have permission.")
                    this.dialogService.openDialogNegative("Don't have permission.");
					this.router.navigate(['/sign-in'], {queryParams: {params : state.url} });
				} else {
					// 전부 통과
					return true;
				}

			} else {
				// 로그인이 되지 않았을 경우
				// alert('Please login first');
                this.dialogService.openDialogNegative("Please login first");
				this.router.navigate(['/sign-in'], {queryParams: {params : state.url} });

			}
			console.log(this.userId)
			console.log(state)
		} catch (error) {
			// alert("Can't find the room.")
            this.dialogService.openDialogNegative("Can't find the room.");
			// window.open('http://localhost:4200/', "_self");
			// this.router.navigate(['http://localhost:4200/']);
			// this.router.navigate(['/sign-in'], {queryParams: {params : state.url} });
			console.log(error)
		}

		// this.enlistedMembers = meetingInfo.enlistedMembers
		// if(!meetingInfo){
		// 	window.location.href = 'https://naver.com/'
		// 	return false;
		// } 








		// 배열 안에 있는 id 값 비교
		// if (!this.enlistedMembers.some((i: any) => i._id === this.userId)) {
		// 	// console.log('Invalid Token');
		// 	alert('초대된 멤버가 아닙니다.');
		// 	this.router.navigate(['']);
		// 	return true;
		// } else {
		// 	console.log('auth redirect');
		// return true;

		// }
	}
}
