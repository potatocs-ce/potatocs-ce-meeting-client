import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient,
    private jwtHelper: JwtHelperService,) { }

  isAuthenticated(): boolean {
    const token = this.getToken();

    return token ? !this.isTokenExpired(token) : false;
  }

  getToken(): string {
    return localStorage.getItem(environment.tokenName) || '';
  }

  setToken(token: string): void {
    localStorage.setItem(environment.tokenName, token);
  }

  removeToken(): void {
    localStorage.removeItem(environment.tokenName);
  }

  isTokenExpired(token: string) {
    console.log(this.jwtHelper.isTokenExpired(token), this.jwtHelper.decodeToken(this.getToken()))
    return this.jwtHelper.isTokenExpired(token)
  }

  getTokenInfo() {
    return this.jwtHelper.decodeToken(this.getToken());
  }
}
