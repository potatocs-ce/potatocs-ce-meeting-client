import { Injectable, inject, signal } from "@angular/core";
import { MatDialog } from "@angular/material/dialog"; // Material Dialog 사용
import { AddSurveyComponent } from "../../components/dialogs/survey/add-survey/add-survey.component"; // 설문 추가 다이얼로그
import { HttpClient } from "@angular/common/http"; // HTTP 요청 처리 (현재는 사용되지 않음)
import { SurveyComponent } from "../../components/dialogs/survey/survey/survey.component"; // 설문 상세 다이얼로그
import { SurveyResultComponent } from "../../components/dialogs/survey/survey-result/survey-result.component"; // 설문 결과 다이얼로그
import { EditSurveyComponent } from "../../components/dialogs/survey/edit-survey/edit-survey.component"; // 설문 수정 다이얼로그

@Injectable({
	providedIn: "root", // 서비스를 애플리케이션 전역에서 사용할 수 있도록 등록
})
export class SurveyService {
	// 설문 목록 데이터를 관리하기 위한 상태 변수 (signal)
	surveys = signal<any>([]);

	// Angular Material Dialog 주입
	public dialog = inject(MatDialog);

	/**
	 * 설문 추가 다이얼로그 열기
	 * @returns {Observable<any>} - 다이얼로그가 닫힌 후의 결과를 반환
	 */
	openAddSurveyDialog() {
		const dialogRef = this.dialog.open(AddSurveyComponent, {
			autoFocus: false, // 다이얼로그 열릴 때 자동 포커스 비활성화
			maxWidth: "700px", // 다이얼로그의 최대 너비
			maxHeight: "95vh", // 다이얼로그의 최대 높이
			width: "95%", // 다이얼로그의 기본 너비
		});

		// 다이얼로그가 닫힌 후 결과 반환
		return dialogRef.afterClosed();
	}

	/**
	 * 설문 상세 다이얼로그 열기
	 * @param {string} _id - 설문의 ID
	 * @returns {Observable<any>} - 다이얼로그가 닫힌 후의 결과를 반환
	 */
	openSurveyDialog(_id: string) {
		const dialogRef = this.dialog.open(SurveyComponent, {
			data: {
				_id, // 다이얼로그에 전달할 데이터 (설문 ID)
			},
			autoFocus: false,
			maxWidth: "700px",
			maxHeight: "95vh",
			width: "95%",
		});

		return dialogRef.afterClosed();
	}

	/**
	 * 설문 결과 다이얼로그 열기
	 * @param {string} _id - 설문의 ID
	 * @returns {Observable<any>} - 다이얼로그가 닫힌 후의 결과를 반환
	 */
	openSurveyResultDialog(_id: string) {
		const dialogRef = this.dialog.open(SurveyResultComponent, {
			data: {
				_id, // 다이얼로그에 전달할 데이터 (설문 ID)
			},
			autoFocus: false,
			maxWidth: "700px",
			maxHeight: "95vh",
			width: "95%",
		});

		return dialogRef.afterClosed();
	}

	/**
	 * 설문 수정 다이얼로그 열기
	 * @param {string} _id - 설문의 ID
	 * @returns {Observable<any>} - 다이얼로그가 닫힌 후의 결과를 반환
	 */
	openEditSurveyDialog(_id: string) {
		const dialogRef = this.dialog.open(EditSurveyComponent, {
			data: {
				_id, // 다이얼로그에 전달할 데이터 (설문 ID)
			},
			autoFocus: false,
			maxWidth: "700px",
			maxHeight: "95vh",
			width: "95%",
		});

		return dialogRef.afterClosed();
	}
}
