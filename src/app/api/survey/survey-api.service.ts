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
}
