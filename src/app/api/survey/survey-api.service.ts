import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SurveyApiService {
  private baseUrl = environment.apiUrl;
  constructor(private http: HttpClient) { }
  addSurvey(survey: any) {
    return this.http.post(this.baseUrl + `/survey/add`, survey)
  }

  getSurveys(meetingId: any) {

    return this.http.get(this.baseUrl + `/survey/meeting/` + meetingId)
  }

  getSurvey(_id: any) {
    return this.http.get(this.baseUrl + '/survey/' + _id);
  }

  survey(_id: string, result: any) {

    return this.http.post(this.baseUrl + '/survey/' + _id, result);
  }

  // 설문 결과 조회
  getSurveyResult(_id: string) {
    return this.http.get(this.baseUrl + `/survey/result/${_id}`)
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
