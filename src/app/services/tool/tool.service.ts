import { Injectable, signal } from "@angular/core";

// 도구 타입 정의
// - type: 도구의 종류 (예: 'click', 'pen', 'eraser' 등)
// - color: 도구의 색상 (예: 'black', 'red' 등)
// - width: 도구의 너비 (픽셀 단위)
type toolType = {
	type: string; // 도구의 종류
	color: string; // 도구의 색상
	width: number; // 도구의 두께
};

@Injectable({
	providedIn: "root", // 서비스를 애플리케이션 전역에서 사용할 수 있도록 등록
})
export class ToolService {
	constructor() {}

	// 현재 선택된 도구의 상태를 관리하는 signal
	// 기본값:
	// - type: 'click' (클릭 모드)
	// - color: 'black' (검은색)
	// - width: 1 (1px 너비)
	tool = signal<toolType>({
		type: "click", // 초기 도구 타입: 클릭 모드
		color: "black", // 초기 도구 색상: 검은색
		width: 1, // 초기 도구 너비: 1px
	});
}
