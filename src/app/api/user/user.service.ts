import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Token } from '@angular/compiler';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getUsers() {

  }


  signIn(userData: any): Observable<Token> {
    console.log('userData', userData);
    return this.http.post<Token>('/apim/v1/auth/signIn', userData)
      .pipe(
        tap(
          (res: any) => {
            console.log(res)
          }),

      )
  }
}
