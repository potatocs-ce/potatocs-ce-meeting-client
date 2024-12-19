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
		if (participant) {
			this.survayService.openSurveyResultDialog(_id).subscribe((result: any) => {});
		} else {
			this.survayService.openSurveyDialog(_id).subscribe((result: any) => {});
		}
	}

	editSurvey(_id: string) {
		this.survayService.openEditSurveyDialog(_id).subscribe((result: any) => {});
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
