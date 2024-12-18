import { Injectable } from "@angular/core";
import { JwtHelperService } from "@auth0/angular-jwt"; // JWT 관련 유틸리티 제공
import { HttpClient } from "@angular/common/http"; // HTTP 요청 처리
import { environment } from "../../../environments/environment"; // 환경 설정 파일 가져오기

@Injectable({
	providedIn: "root", // AuthService를 애플리케이션 전역에서 사용할 수 있도록 등록
})
export class AuthService {
	constructor(
		private http: HttpClient, // HTTP 클라이언트 인스턴스
		private jwtHelper: JwtHelperService // JWT 유틸리티를 주입
	) {}

	/**
	 * 사용자 인증 상태 확인
	 * @returns {boolean} - 사용자가 인증된 상태인지 여부 반환
	 */
	isAuthenticated(): boolean {
		const token = this.getToken(); // 저장된 토큰 가져오기
		// 토큰이 존재하고 만료되지 않았으면 true, 그렇지 않으면 false
		return token ? !this.isTokenExpired(token) : false;
	}

	/**
	 * 로컬 스토리지에서 JWT 토큰 가져오기
	 * @returns {string} - 저장된 토큰 문자열 (없으면 빈 문자열 반환)
	 */
	getToken(): string {
		return localStorage.getItem(environment.tokenName) || "";
	}

	/**
	 * JWT 토큰 저장
	 * @param {string} token - 새로 발급받은 토큰
	 */
	setToken(token: string): void {
		localStorage.setItem(environment.tokenName, token);
	}

	/**
	 * 로컬 스토리지에서 JWT 토큰 삭제
	 */
	removeToken(): void {
		localStorage.removeItem(environment.tokenName);
	}

	/**
	 * JWT 토큰의 만료 여부 확인
	 * @param {string} token - 검사할 JWT 토큰
	 * @returns {boolean} - 만료되었으면 true, 그렇지 않으면 false
	 */
	isTokenExpired(token: string): boolean {
		// 토큰의 만료 여부와 디코딩된 정보를 콘솔에 출력
		console.log(this.jwtHelper.isTokenExpired(token), this.jwtHelper.decodeToken(this.getToken()));
		// JwtHelperService를 사용해 토큰 만료 여부 반환
		return this.jwtHelper.isTokenExpired(token);
	}

	/**
	 * JWT 토큰에서 디코딩된 정보 가져오기
	 * @returns {any} - 디코딩된 토큰 정보
	 */
	getTokenInfo() {
		return this.jwtHelper.decodeToken(this.getToken());
	}
}
