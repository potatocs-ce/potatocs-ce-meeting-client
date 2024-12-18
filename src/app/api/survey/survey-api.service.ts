import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";

@Injectable({
	providedIn: "root",
})
export class SurveyApiService {
	private baseUrl = environment.apiUrl;
	constructor(private http: HttpClient) {}
	addSurvey(survey: any) {
		// 설문 데이터를 서버에 추가
		// POST 요청으로 설문 데이터를 `/survey/add` 엔드포인트에 전송
		return this.http.post(this.baseUrl + `/survey/add`, survey);
	}

	getSurveys(meetingId: any) {
		// 특정 회의(meetingId)에 대한 모든 설문 데이터를 가져옴
		// GET 요청으로 `/survey/meeting/{meetingId}` 엔드포인트에서 데이터 수신
		return this.http.get(this.baseUrl + `/survey/meeting/` + meetingId);
	}

	getSurvey(_id: any) {
		// 특정 설문(_id)에 대한 상세 데이터를 가져옴
		// GET 요청으로 `/survey/{_id}` 엔드포인트에서 데이터 수신
		return this.http.get(this.baseUrl + "/survey/" + _id);
	}

	survey(_id: string, result: any) {
		// 설문 결과 데이터를 서버에 저장
		// POST 요청으로 설문 결과를 `/survey/{_id}` 엔드포인트에 전송
		return this.http.post(this.baseUrl + "/survey/" + _id, result);
	}

	// 설문 결과 조회
	getSurveyResult(_id: string) {
		return this.http.get(this.baseUrl + `/survey/result/${_id}`);
	}

	// 설문지 삭제
	deleteSurvey(_id: string) {
		return this.http.delete(this.baseUrl + `/survey/${_id}`);
	}

	// 설문지 수정
	editSurvey(_id: string, survey: any) {
		return this.http.patch(this.baseUrl + `/survey/${_id}`, survey);
	}
}
