import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DocApiService {
  private baseUrl = environment.apiUrl;
  constructor(private http: HttpClient) { }

  // 문서 리스트 조회
  getDocList(meetingId: string) {
    return this.http.get(this.baseUrl + '/doc/doc_list/' + meetingId)
  }

  // 문서 조회
  getDoc(doc_id: string) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/pdf',
      Accept: 'application/pdf',
    });
    return this.http.get(this.baseUrl + '/doc/' + doc_id, {
      headers: headers,
      responseType: 'blob',
    })
  }

  // 문서 등록
  uploadFile(meetingId: string, file: any) {
    const formData: any = new FormData();
    formData.append("file", file[0]);
    return this.http.post(this.baseUrl + '/doc/upload/' + meetingId, formData)
  }

  // 문서 삭제 todo
}
