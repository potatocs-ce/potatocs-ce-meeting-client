import { Injectable } from "@angular/core";
import { Socket } from "ngx-socket-io";
import { SurveyApiService } from "../../../api/survey/survey-api.service";
import { SurveyService } from "../../survey/survey.service";
import { MeetingService } from "../../meeting/meeting.service";
import { AuthService } from "../../auth/auth.service";

@Injectable({
	providedIn: "root",
})
export class SurveySocketService {
	constructor(
		private socket: Socket,
		private surveyApiService: SurveyApiService,
		private surveyService: SurveyService,
		private meetingService: MeetingService,
		private authService: AuthService
	) {
		this.socket.on("updateSurveyList", (res: any) => {
			// this.surveyService.surveys.set(res);
			this.surveyApiService.getSurveys(this.meetingService.meeting_room_id()).subscribe((res: any) => {
				this.surveyService.surveys.set(res);
			});
		});
	}

	updateSurvey() {
		// 소켓을 사용해 'updateSurveyList' 이벤트를 서버로 전송
		// 서버로 전달하는 데이터:
		// - _id: 현재 회의실 ID (meetingService에서 가져옴)
		// - userId: 현재 사용자 ID (authService에서 JWT 토큰 정보에서 가져옴)
		this.socket.emit(
			"updateSurveyList",
			{
				_id: this.meetingService.meeting_room_id(), // 현재 회의실 ID
				userId: this.authService.getTokenInfo()._id, // 현재 사용자 ID
			},
			(res: any) => {
				// 서버로부터 받은 응답 데이터를 설문 목록 상태에 반영
				this.surveyService.surveys.set(res);
			}
		);
	}
}
