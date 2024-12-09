import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, NgZone, effect, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { VideoService } from '../../services/video/video.service';
import { CanvasService } from '../../services/canvas/canvas.service';
import { DrawingService } from '../../services/drawing/drawing.service';
import { ToolService } from '../../services/tool/tool.service';
import { BehaviorSubject } from 'rxjs';
import { MeetingServiceAPI } from '../../api/meeting/meetingAPI.service';
import { MeetingService } from '../../services/meeting/meeting.service';
import { Socket } from 'ngx-socket-io';
@Component({
  selector: 'app-present',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: './present.component.html',
  styleUrl: './present.component.scss'
})
export class PresentComponent {

  videoStream: any = undefined;

  isWidth: boolean | undefined = undefined;

  zoomScale: number = 1;
  firstRender: boolean = true;

  videoWidth: number | null = 0;
  videoHeight: number | null = 0;

  tool: any = { type: 'pen', color: 'black' }

  observer_target: any;
  screen: any;

  constructor(
    private host: ElementRef,
    private zone: NgZone,
    private videoService: VideoService,
    private canvasService: CanvasService,
    private drawingService: DrawingService,
    private toolService: ToolService,
    private meetingApiService: MeetingServiceAPI,
    private meetingService: MeetingService,
    private socket: Socket) {
    effect(() => {
      this.videoStream = this.meetingService.present_user_info()

      if (this.videoStream == undefined) {

        // this.observer.unobserve(document.getElementsByClassName('present_container')[0]);
        const present: any = document.getElementById('present');

        present.style.width = '100%';
        present.style.height = '100%';

        this.videoWidth = 0;
        this.videoHeight = 0;

        this.zoomScale = 1;
        this.firstRender = true;

      } else {
        // 이거 안해주니까 뭔가 동작을 안함....
        const elem: any = document.getElementById('present_video');
        if (elem) {
          elem.playsInline = true;
          elem.autoplay = true;
          elem.muted = true;
        }
      }
    })

    effect(() => {
      this.meetingService.skipList()


    })
  }
  width$ = new BehaviorSubject<number>(0);
  observer: any;

  ngAfterViewInit() {
    this.observer = new ResizeObserver(entries => {
      this.zone.run(() => {
        const video_target: any = document.getElementById('present_video');

        this.videoResize(video_target)
      });
    });

    this.observer_target = document.getElementsByClassName('present_container')[0]

    this.observer.observe(this.observer_target);
  }

  ngOnDestroy() {
    this.observer.unobserve(this.observer_target);
  }

  /**
   * 비디오 크기 변경 = 비디오가 바뀌거나 새로 들어왔을 경우
   * @param target 비디오 태그
   */
  videoResize(target: any) {


    const present: any = document.getElementById('present');
    // const present_section: any = document.getElementById('present_section');

    // canvas
    present.style.width = '100%';
    present.style.height = '100%';

    if (this.videoWidth !== target?.videoWidth && this.videoHeight !== target?.videoHeight) {

      this.videoWidth = target?.videoWidth;
      this.videoHeight = target?.videoHeight;
      this.firstRender = true;
    }

    this.isWidth = undefined




    const pw = present.clientWidth;
    const ph = present.clientHeight;

    const vw = target.clientWidth;
    const vh = target.clientHeight;

    if (ph < vh + (pw - vw)) {
      // 세로가 길면
      target.style.height = `${ph}px`;
      target.style.width = 'auto';
      present.style.width = 'fit-content';
    } else {
      // 가로가 길면
      target.style.width = `${pw}px`;
      target.style.height = 'auto';
      present.style.height = 'fit-content';
    }

  }

  /**
   * 윈도우 화면 변화 감지 함수
   */
  @HostListener('window:resize', ['$event'])
  onResize() {
    const video_target: any = document.getElementById('present_video');
    this.videoResize(video_target)
  }


  /**
   * 비디오 화면 캡쳐 함수
   * @param e video tag
   */
  capture(e: any) {
    // console.log(e);
    const canvas = document.createElement('canvas');
    canvas.width = e.clientWidth;
    canvas.height = e.clientHeight;

    canvas.getContext('2d')?.drawImage(e, 0, 0, canvas.width, canvas.height);
    const dataURL = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = 'capture.png';
    a.click();
  }
}
