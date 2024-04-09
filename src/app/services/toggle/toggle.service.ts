import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ToggleService {

  // 오른쪽 메뉴 모드 토글
  toggle_mode = signal<string>('group')

  // 비디오, 문서(판서) 모드 토글 [video, document]
  toggle_video = signal<string>('document')


  // 화면 공유 중인지 확인 토글
  toggle_screen_share = signal<boolean>(false);

  constructor() { }
}
