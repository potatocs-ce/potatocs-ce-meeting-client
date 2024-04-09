import { CommonModule } from '@angular/common';
import { Component, effect } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { ToggleService } from '../../services/toggle/toggle.service';
@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatRippleModule],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss'
})
export class ToolbarComponent {
  // 메뉴 모드
  toggle_mode: string = '';

  // 화면 공유 모드
  toggle_screen_share: boolean = false;

  // 문서 모드
  toggle_video: string = '';

  constructor(private toggleService: ToggleService) {
    effect(() => {
      this.toggle_mode = this.toggleService.toggle_mode();
      this.toggle_screen_share = this.toggleService.toggle_screen_share();
      this.toggle_video = this.toggleService.toggle_video();
    })
  }
  // 오른쪽 메뉴 토글 바꾸기
  changeToggleMode(mode: string) {
    if (this.toggle_mode == mode) {
      mode = 'close';
    }

    this.toggleService.toggle_mode.set(mode);
  }

  // 화면 공유
  screen_share() {
    this.toggleService.toggle_screen_share.set(!this.toggle_screen_share)
  }

  // 비디오 모드, 문서 모드 변경
  change_video_document(mode: string) {
    this.toggleService.toggle_video.set(mode);
  }
}
