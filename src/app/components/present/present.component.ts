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
import { VideoDrawingService } from '../../services/socket/video_drawing/video-drawing.service';
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
    private videoDrawingService: VideoDrawingService,
    private meetingApiService: MeetingServiceAPI,
    private meetingService: MeetingService,
    private socket: Socket) {
    effect(() => {
      this.videoStream = this.meetingService.present_user_info()

      if (this.videoStream == undefined) {

        // this.observer.unobserve(document.getElementsByClassName('present_container')[0]);
        const present: any = document.getElementById('present');
        const data_canvas: any = document.getElementById('data_canvas');
        const drawing_canvas: any = document.getElementById('drawing_canvas');

        present.style.width = '100%';
        present.style.height = '100%';


        data_canvas.width = 0;
        data_canvas.height = 0;

        drawing_canvas.width = 0;
        drawing_canvas.height = 0;

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
      this.tool = this.toolService.tool();
      this.checkClickMode()
    })


    effect(() => {
      this.meetingService.skipList()
      untracked(() => {
        if (!this.firstRender) {

          const data_canvas: any = document.getElementById('data_canvas');
          const data_context: any = data_canvas.getContext('2d');
          data_context.clearRect(0, 0, data_canvas.width, data_canvas.height);
          this.videoDrawingService.drawVarArray()[this.videoStream?.user_id]?.forEach((data: any) => {
            if (data.screen == this.videoStream?.screen) {
              if (!this.meetingService.skipList().includes(data.userId)) {
                this.drawingService.end(data_context, data['drawingEvent'].points, data['drawingEvent'].tool)
              }
            }
          })
        }
      })

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
   * 현재 모드가 클릭 모드인지 확인하기 위한 함수 
   */
  checkClickMode() {

  }

  setCanvas() {
    const data_canvas: any = document.getElementById('data_canvas');
    const drawing_canvas: any = document.getElementById('drawing_canvas');
    this.canvasService.addEventHandler(drawing_canvas, data_canvas, this.tool, this.zoomScale)
  }

  /**
   * 타입 지정 함수
   * @param type 지정할 타입
   */
  setType(type: string) {
    this.tool.type = type;

    if (type == 'highlighter' && this.tool.color == 'black') {
      this.tool.color = 'yellow'
    }

    this.toolService.tool.set({ ...this.tool })
    this.setCanvas()
  }

  /**
   * 색 지정 함수
   * @param color 색
   */
  setColor(color: string) {
    this.tool.color = color;
    this.toolService.tool.set({ ...this.tool })
    this.setCanvas()
  }

  /**
   * 팬 두께 지정
   * @param width 두께
   */
  setWidth(width: number) {
    this.tool.width = width;

    this.toolService.tool.set({ ...this.tool })
    this.setCanvas()
  }


  clearDrawing() {
    // 여기 한 번 확인 물어보는 로직 추가
    if (window.confirm('Do you want to delete all drawings on the current page?')) {

      this.meetingApiService.clearVideoDrawing(this.meetingService.meeting_room_id(), this.videoStream?.user_id).subscribe((res: any) => {
        if (res.message != 'success') {
          console.error('실패')
        }
      })

      // 여기서 userId 판서 정보 일단 다 지우기
      this.videoDrawingService.drawVarArray()[this.videoStream?.user_id] = [];
      const video_target: any = document.getElementById('data_canvas');
      const target_context: any = video_target.getContext('2d');
      target_context.clearRect(0, 0, video_target.width, video_target.height);
      this.socket.emit('draw:video_clear', { room_id: this.meetingService.meeting_room_id(), target_id: video_target.parentNode.id, meeting_id: this.meetingService.meeting_room_id() })
    }
  }

  /**
   * 비디오 크기 변경 = 비디오가 바뀌거나 새로 들어왔을 경우
   * @param target 비디오 태그
   */
  videoResize(target: any) {
    this.videoDrawingService.stopQueue();

    const present: any = document.getElementById('present');
    // const present_section: any = document.getElementById('present_section');

    // canvas
    const data_canvas: any = document.getElementById('data_canvas');
    const data_context: any = data_canvas.getContext('2d');

    const drawing_canvas: any = document.getElementById('drawing_canvas');
    const drawing_context: any = drawing_canvas.getContext('2d');

    const target_canvas: any = document.getElementById('target_canvas');
    const target_context: any = target_canvas.getContext('2d');

    present.style.width = '100%';
    present.style.height = '100%';

    if (!this.videoStream || !target?.videoWidth) {
      data_canvas.width = 0;
      data_canvas.height = 0;

      drawing_canvas.width = 0;
      drawing_canvas.height = 0;

      target_canvas.width = 0;
      target_canvas.height = 0;

      this.zoomScale = 1;
      this.firstRender = true;

      return
    }

    if (this.videoWidth !== target?.videoWidth && this.videoHeight !== target?.videoHeight) {

      this.videoWidth = target?.videoWidth;
      this.videoHeight = target?.videoHeight;
      this.firstRender = true;
    }

    const originalWidth = 320;


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
    if (this.firstRender) {
      this.zoomScale = 1
      console.log(originalWidth, this.zoomScale)
      this.zoomScale = target.clientWidth / originalWidth * this.zoomScale;
      this.firstRender = false;

    } else {

      this.zoomScale = target.clientWidth / data_canvas.width * this.zoomScale;
    }
    // 캔버스 사이즈 설정
    data_canvas.width = target.clientWidth;
    data_canvas.height = target.clientHeight;

    drawing_canvas.width = target.clientWidth;
    drawing_canvas.height = target.clientHeight;

    target_canvas.width = target.clientWidth;
    target_canvas.height = target.clientHeight;

    // 캔버스가 바뀐 scale 만큼 
    data_context.setTransform(this.zoomScale, 0, 0, this.zoomScale, 0, 0)
    drawing_context.setTransform(this.zoomScale, 0, 0, this.zoomScale, 0, 0)
    target_context.setTransform(this.zoomScale, 0, 0, this.zoomScale, 0, 0)


    this.videoDrawingService.drawVarArray()[this.videoStream?.user_id]?.forEach((data: any) => {
      if (data.screen == this.videoStream?.screen) {
        if (!this.meetingService.skipList().includes(data.userId)) {
          this.drawingService.end(data_context, data['drawingEvent'].points, data['drawingEvent'].tool)
        }
      }
    })

    this.canvasService.addEventHandler(drawing_canvas, data_canvas, this.tool, this.zoomScale)
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
