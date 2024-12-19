import { CommonModule } from "@angular/common";
import { Component, effect } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { SurveyService } from "../../services/survey/survey.service";
import { AuthService } from "../../services/auth/auth.service";
import { SurveyApiService } from "../../api/survey/survey-api.service";
import { DialogService } from "../../services/dialog/dialog.service";
import { SurveySocketService } from "../../services/socket/survey/survey-socket.service";

@Component({
	selector: "app-survey",
	standalone: true,
	imports: [CommonModule, MatIconModule, MatButtonModule],
	templateUrl: "./survey.component.html",
	styleUrl: "./survey.component.scss",
})
export class SurveyComponent {
	surveys: any;
	user_id: string = "";
	constructor(
		public survayService: SurveyService,
		private authService: AuthService,
		private surveyApiService: SurveyApiService,
		private dialogService: DialogService,
		private surveySocketService: SurveySocketService
	) {
		effect(() => {
			this.surveys = this.survayService.surveys();
		});

		this.user_id = authService.getTokenInfo()._id;
	}
	addSurvey() {
		this.survayService.openAddSurveyDialog().subscribe((result: any) => {});
	}

	startSurvey(_id: string, participant: boolean) {
		// 설문을 시작하는 함수.
		// 참가 여부(participant)에 따라 다른 다이얼로그를 열음.

		if (participant) {
			// 사용자가 설문에 참여 중인 경우 설문 결과 다이얼로그를 엶.
			this.survayService.openSurveyResultDialog(_id).subscribe((result: any) => {
				// 설문 결과 다이얼로그 작업 후의 결과를 처리할 콜백 (현재는 빈 처리).
			});
		} else {
			// 사용자가 설문에 참여하지 않은 경우 설문 다이얼로그를 엶.
			this.survayService.openSurveyDialog(_id).subscribe((result: any) => {
				// 설문 다이얼로그 작업 후의 결과를 처리할 콜백 (현재는 빈 처리).
			});
		}
	}

	editSurvey(_id: string) {
		// 특정 설문을 수정하는 함수.
		// survayService를 사용하여 설문 편집 다이얼로그를 엶.
		this.survayService.openEditSurveyDialog(_id).subscribe((result: any) => {
			// 다이얼로그에서의 작업 결과를 처리할 수 있는 콜백 (현재는 빈 처리).
		});
	}

	removeSurvey(_id: string) {
		// 특정 설문을 삭제하는 함수.
		// surveyApiService를 통해 서버에 삭제 요청을 보냄.
		this.surveyApiService.deleteSurvey(_id).subscribe((result: any) => {
			// 서버 응답의 상태(result.status)가 성공인 경우.
			if (result.status) {
				// 성공 메시지 다이얼로그를 표시.
				this.dialogService.openDialogPositive("Success to remove a survey");
				// surveySocketService를 통해 설문 목록 업데이트.
				this.surveySocketService.updateSurvey();
			} else {
				// 삭제 실패 시 실패 메시지 다이얼로그를 표시.
				this.dialogService.openDialogPositive("Failed to remove a survey");
			}
		});
	}
}
