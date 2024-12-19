import { CommonModule } from "@angular/common";
import { Component, Inject } from "@angular/core";
import { CardComponent } from "../../../public/card/card.component";
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatSliderModule } from "@angular/material/slider";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from "@angular/cdk/drag-drop";
import { SurveyService } from "../../../../services/survey/survey.service";
import { Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MeetingService } from "../../../../services/meeting/meeting.service";
import { SurveyApiService } from "../../../../api/survey/survey-api.service";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { SurveySocketService } from "../../../../services/socket/survey/survey-socket.service";
import { DialogService } from "../../../../services/dialog/dialog.service";

@Component({
	selector: "app-add-survey",
	standalone: true,
	imports: [
		CommonModule,
		CardComponent,
		MatIconModule,
		MatButtonModule,
		MatInputModule,
		FormsModule,
		CdkDropList,
		CdkDrag,
		MatSlideToggleModule,
		MatSliderModule,
		DragDropModule,
	],
	templateUrl: "./add-survey.component.html",
	styleUrl: "./add-survey.component.scss",
})
export class AddSurveyComponent {
	//제목
	title: string = "";

	// 설명
	description: string = "";

	// card 초기화
	cards: any[] = [
		{
			index: 1,
			item_title: "",
			num_of_answer: 1,
			item_options: [{ index: 1, option: "option 1" }],
			required: false,
		},
	];

	constructor(
		private surveyApiService: SurveyApiService,
		private router: Router,
		private meetingService: MeetingService,
		public dialogRef: MatDialogRef<AddSurveyComponent>,
		private surveyService: SurveyService,
		private surveySocketService: SurveySocketService,
		private dialogService: DialogService,
		@Inject(MAT_DIALOG_DATA) public data: any
	) {}

	// 카드 추가
	addCard() {
		let next_index = 0;
		this.cards.map((card) => {
			next_index < card.index ? (next_index = card.index) : "";
		});
		this.cards.push({
			index: next_index + 1,
			item_title: "",
			num_of_answer: 1,
			item_options: [{ index: 1, option: "option 1" }],
			required: false,
		});
	}

	// 카드 삭제
	removeCard(idx: number) {
		this.cards.splice(idx, 1);
	}

	// 항목 추가
	addItem(idx: number) {
		let next_index = 0;
		this.cards[idx].item_options.map((item: any) => {
			next_index < item.index ? (next_index = item.index) : "";
		});
		this.cards[idx].item_options.push({ index: next_index + 1, option: `option ${next_index + 1}` });
	}

	// 항목 삭제
	removeItem(idx: number, item_idx: number) {
		this.cards[idx].item_options.splice(item_idx, 1);
	}

	// card drop
	cardDrop(event: CdkDragDrop<string[]>) {
		moveItemInArray(this.cards, event.previousIndex, event.currentIndex);
	}

	itemDrop(event: CdkDragDrop<string[]>, idx: number) {
		moveItemInArray(this.cards[idx].item_options, event.previousIndex, event.currentIndex);
	}

	// 제출
	submit() {
		// 설문 제출 함수.

		// 설문 제목이 비어 있는 경우 에러 메시지 다이얼로그를 표시.
		if (this.title == "") {
			this.dialogService.openDialogNegative("Title is required"); // 제목이 필수임을 알림.
		} else {
			// 설문 데이터를 서버에 전송.
			this.surveyApiService
				.addSurvey({
					title: this.title, // 설문 제목.
					description: this.description, // 설문 설명.
					cards: this.cards, // 설문 카드 배열.
					meetingId: this.meetingService.meeting_room_id(), // 현재 회의 ID.
				})
				.subscribe((res: any) => {
					// 서버 응답 상태 확인.
					if (res.status) {
						// 성공 시 성공 메시지 다이얼로그를 표시.
						this.dialogService.openDialogPositive("Success to add a survey");

						// 다른 사용자에게 설문 리스트 업데이트 알림.
						this.surveySocketService.updateSurvey();

						// 설문 추가 완료 후 창 닫기.
						this.onNoClick();
					} else {
						// 실패 시 실패 메시지 다이얼로그를 표시.
						this.dialogService.openDialogNegative("Failed to add a survey...");
					}
				});
		}
	}

	// 다이어로그 끄기 함수
	onNoClick(): void {
		this.dialogRef.close();
	}
}
