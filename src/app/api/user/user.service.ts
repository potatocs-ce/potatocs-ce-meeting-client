import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Token } from '@angular/compiler';
import { AuthService } from '../../services/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) { }

  // userId에 해당하는 사용자 정보 요청
  getUserInfo(userId: any) {
    return this.http.get(this.baseUrl + '/auth/getUserInfo/' + userId);
  }

  // 로그인 요청
  signIn(userData: any): Observable<Token> {
    console.log('userData', userData);
    return this.http.post<Token>(this.baseUrl + '/auth/signIn', userData)
      .pipe(
        tap(
          (res: any) => {
            this.authService.setToken(res.token)
            console.log(res)
          }),

      )
  }
}
