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

  getUsers() {

  }


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
