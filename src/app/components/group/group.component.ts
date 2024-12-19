import { CommonModule } from "@angular/common";
import { Component, effect } from "@angular/core";
import { MeetingService } from "../../services/meeting/meeting.service";
import { MeetingServiceAPI } from "../../api/meeting/meetingAPI.service";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { MatIconModule } from "@angular/material/icon";
import { RoleSocketService } from "../../services/socket/role/role-socket.service";
import { Socket } from "ngx-socket-io";
import { AuthService } from "../../services/auth/auth.service";

@Component({
	selector: "app-group",
	standalone: true,
	imports: [CommonModule, MatIconModule, MatButtonModule, MatMenuModule],
	templateUrl: "./group.component.html",
	styleUrl: "./group.component.scss",
})
export class GroupComponent {
	meetingInfo: any;

	currentMembers: any;
	currentMembersCount: any = 0;

	skipList: any = [];

	user_id: any; // 이건 현재 로그인한 사용자의 사용자 아이디

	constructor(
		private meetingService: MeetingService,
		private meetingServiceAPI: MeetingServiceAPI,
		private roleSocketService: RoleSocketService,
		private socket: Socket,
		private authService: AuthService
	) {
		// effect for meetingService
		effect(() => {
			this.meetingInfo = this.meetingService.meeting_info();
			this.currentMembersCount = 0;
			this.currentMembers = this.meetingInfo.currentMembers;
			this.currentMembers.forEach((currentMember: any) => {
				if (currentMember.online == true) {
					this.currentMembersCount += 1; // online: true일 경우 ++
				}
			});
		});

		this.socket.on("refreshRole", ({ member_id, role }: any) => {
			this.meetingService.meeting_info.update((meeting_info: any) => {
				meeting_info.currentMembers.forEach((currentMember: any) => {
					if (currentMember.member_id._id == member_id) {
						currentMember.role = role;
					}
				});
				return meeting_info;
			});
		});

		effect(() => {
			this.skipList = this.meetingService.skipList();
		});
	}

	ngOnInit() {
		this.user_id = this.authService.getTokenInfo()._id;
	}

	ngAfterViewInit() {}

	// role 변경
	chooseRole(role: string, i: number) {
		if (role == this.currentMembers[i].role) return;

		this.roleSocketService
			.updateRole(this.meetingInfo._id, role, this.currentMembers[i].member_id._id)
			.then((result) => {
				if (result === "success") {
					this.meetingService.meeting_info.update((meeting_info: any) => {
						meeting_info.currentMembers[i].role = role;

						return meeting_info;
					});
				}
			});
	}

	getParticipantState() {
		const meetingId = this.meetingService.meeting_room_id();
	}

	checkVisibility(member: any) {
		this.meetingService.skipList.update((list: any) => {
			if (!list.includes(member.member_id._id)) {
				list.push(member.member_id._id);
			} else {
				list = list.filter((l: any) => l != member.member_id._id);
			}
			return [...list];
		});
	}
}
