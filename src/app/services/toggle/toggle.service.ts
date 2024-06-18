import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ToggleService {

  // 오른쪽 메뉴 모드 토글 [group, chat, survey, close]
  toggle_mode = signal<string>('group')

  // 비디오, 문서(판서) 모드 토글 [video, document]
  toggle_video_whiteboard = signal<string>('video')


  // 화면 공유 중인지 확인 토글
  toggle_screen_share = signal<boolean>(false);

  // 비디오 토글 
  toggle_video = signal<boolean>(false);

  // 오디오 토글
  toggle_audio = signal<boolean>(false);


  // 아래 비디오 리스트들 토글
  toggle_audience = signal<boolean>(true);

  ////////////////////////////////////////////

  // 판서 상태 click, pen, hilight, eraser, tool
  toggle_drawing_mode = signal<string>('click');

  toggle_color = signal<string>('red');


  toggle_width = signal<number>(20);



  constructor() { }
}
