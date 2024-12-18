import { Injectable, signal } from "@angular/core";

@Injectable({
	providedIn: "root",
})
export class MeetingService {
	// 클래스 생성자
	constructor() {}

	// 현재 회의실 ID (회의실을 식별하는 고유한 문자열)
	meeting_room_id = signal<string>("");

	// 현재 회의실 제목 (회의실 이름)
	meeting_room_title = signal<string>("");

	// 회의 정보 (전체적인 회의 상태나 설정 정보를 담을 수 있음)
	meeting_info = signal<any>(undefined);

	// 회의 채팅 정보 (채팅 메시지 및 관련 데이터)
	meeting_chat_info = signal<any>(undefined);

	// 판서(화이트보드)에서 제외할 데이터 리스트
	skipList = signal<any>([]);

	// 현재 발표자 정보 (현재 발표 중인 사용자에 대한 정보)
	present_user_info = signal<any>(undefined);

	// 현재 참가 중인 사용자들의 정보 리스트
	users_info = signal<any>([]);

	// 디바이스 상태 확인 (예: 카메라, 마이크 등 디바이스의 사용 가능 여부)
	device_check: any = signal<any>(false);
}
