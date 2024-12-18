import { Injectable, signal } from "@angular/core";

@Injectable({
	providedIn: "root", // 이 서비스가 애플리케이션 전역에서 사용될 수 있도록 등록
})
export class ToggleService {
	// 오른쪽 메뉴 모드 토글 상태
	// 가능한 값: 'group' (그룹), 'chat' (채팅), 'survey' (설문), 'close' (닫힘)
	toggle_mode = signal<string>("close");

	// 비디오와 문서(판서) 모드 토글 상태
	// 가능한 값: 'video' (비디오 모드), 'document' (문서 모드)
	toggle_video_whiteboard = signal<string>("video");

	// 화면 공유 중인지 확인하는 토글 상태
	// true: 화면 공유 중, false: 화면 공유 중 아님
	toggle_screen_share = signal<boolean>(false);

	// 비디오 상태 토글
	// true: 비디오 활성화, false: 비디오 비활성화
	toggle_video = signal<boolean>(false);

	// 오디오 상태 토글
	// true: 오디오 활성화, false: 오디오 비활성화
	toggle_audio = signal<boolean>(false);

	// 시청자 보기 토글
	// true: 시청자 리스트 활성화, false: 비활성화
	toggle_audience = signal<boolean>(true);

	////////////////////////////////////////////

	// 판서(화이트보드) 상태 토글
	// 가능한 값: 'click' (클릭), 'pen' (펜), 'hilight' (형광펜), 'eraser' (지우개), 'tool' (도구)
	toggle_drawing_mode = signal<string>("click");

	// 현재 선택된 색상 토글
	// 가능한 값: 색상 이름 또는 색상 코드 (예: 'red', '#FF0000')
	toggle_color = signal<string>("red");

	// 판서 도구의 두께 토글
	// 기본값: 20
	toggle_width = signal<number>(20);

	// 문서 메뉴 상태 토글
	// true: 문서 메뉴 활성화, false: 비활성화
	toggle_doc_menu = signal<boolean>(true);

	constructor() {}
}
