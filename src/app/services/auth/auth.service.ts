import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ENV } from 'src/app/config/config';
import { Observable } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';

import { JwtHelperService } from '@auth0/angular-jwt';


interface Token {
    token: String
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {


    constructor(
        private http: HttpClient,
        private jwtHelper: JwtHelperService,

    ) { }

    signIn(userData: any): Observable<Token> {
        console.log('userData', userData);
        return this.http.post<Token>('/apim/v1/auth/signIn', userData)
            .pipe(
                tap(
                    (res: any) => {
                        this.setToken(res.token)
                    }),
                shareReplay()
            )
    }

    isAuthenticated(): boolean {
        const token = this.getToken();
        return token ? !this.isTokenExpired(token) : false;
    }

    getToken(): string {
        return localStorage.getItem(ENV.tokenName) || '';
    }

    setToken(token: string): void {
        localStorage.setItem(ENV.tokenName, token);
    }

    removeToken(): void {
        localStorage.removeItem(ENV.tokenName);
    }

    // jwtHelper
    isTokenExpired(token: string) {
        return this.jwtHelper.isTokenExpired(token);
    }

    getTokenInfo() {
        return this.jwtHelper.decodeToken(this.getToken());
    }

}
