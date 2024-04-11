import { Component, Inject, PLATFORM_ID, effect } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ToolbarComponent } from './layout/toolbar/toolbar.component';
import { MenuComponent } from './layout/menu/menu.component';
import { ToggleService } from './services/toggle/toggle.service';
import { PresentComponent } from './components/present/present.component';
import { AudienceComponent } from './components/audience/audience.component';
import { WhiteboardComponent } from './components/whiteboard/whiteboard.component';
import { DocumentsComponent } from './components/documents/documents.component';
import { VideoService } from './services/video/video.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet,
    ToolbarComponent, MenuComponent,
    PresentComponent, AudienceComponent,
    WhiteboardComponent, DocumentsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'meeting_front';
  toggle_mode: string = '';
  toggle_video_whiteboard: string = '';
  constructor(private toggleService: ToggleService,
    @Inject(PLATFORM_ID) private _platform: Object,
    private videoService: VideoService) {
    effect(() => {
      this.toggle_mode = this.toggleService.toggle_mode();
      this.toggle_video_whiteboard = this.toggleService.toggle_video_whiteboard();
    })

    effect(() => {
      console.log(this.videoService.videoDeivces(), this.videoService.audioDevices())
    })
  }

  ngOnInit() {
    if (isPlatformBrowser(this._platform) && 'mediaDevices' in navigator) {
      navigator.mediaDevices.enumerateDevices().then((devices: any) => {
        devices.forEach((device: any) => {
          // 오디오 타입인 경우
          if ('audioinput' === device.kind) {
            // 만약 첫 값이면
            if (this.videoService.audioDevices().length == 0) {
              this.videoService.nowAudioId.set(device.deviceId);
            }

            this.videoService.audioDevices.set([...this.videoService.audioDevices(), { label: device.label, deviceId: device.deviceId }])
          }
          // 비디오 타입인 경우
          else if ('videoinput' === device.kind) {
            // 만약 첫 값이면
            if (this.videoService.videoDeivces().length == 0) {
              this.videoService.nowVideoId.set(device.deviceId);
            }

            this.videoService.videoDeivces.set([...this.videoService.videoDeivces(), { label: device.label, deviceId: device.deviceId }])
          }
        })
      })
    }
  }
}
