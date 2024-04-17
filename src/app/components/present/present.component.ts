import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, NgZone, effect } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { VideoService } from '../../services/video/video.service';
import { CanvasService } from '../../services/canvas/canvas.service';
import { DrawingService } from '../../services/drawing/drawing.service';
import { ToolService } from '../../services/tool/tool.service';
import { BehaviorSubject } from 'rxjs';
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

  tool: any = { type: 'pen', color: 'black' }

  constructor(
    private host: ElementRef,
    private zone: NgZone,
    private videoService: VideoService,
    private canvasService: CanvasService,
    private drawingService: DrawingService,
    private toolService: ToolService) {
    effect(() => {
      this.videoStream = this.videoService.presentVideoStream()

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

    this.observer.observe(document.getElementsByClassName('present_container')[0]);
  }

  ngOnDestroy() {
    this.observer.unobserve(document.getElementsByClassName('present_container')[0]);
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

  /**
   * 비디오 크기 변경 = 비디오가 바뀌거나 새로 들어왔을 경우
   * @param target 비디오 태그
   */
  videoResize(target: any) {
    const present: any = document.getElementById('present');
    const present_section: any = document.getElementById('present_section');

    // canvas
    const data_canvas: any = document.getElementById('data_canvas');
    const data_context: any = data_canvas.getContext('2d');
    const drawing_canvas: any = document.getElementById('drawing_canvas');
    const drawing_context: any = drawing_canvas.getContext('2d');
    present.style.width = '100%';
    present.style.height = '100%';

    if (!this.videoStream) {
      data_canvas.width = 0;
      data_canvas.height = 0;

      drawing_canvas.width = 0;
      drawing_canvas.height = 0;

      return
    }
    const originalWidth = target.videoWidth;

    this.isWidth = undefined




    const pw = present.clientWidth;
    const ph = present_section.clientHeight;

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

    // 캔버스가 바뀐 scale 만큼 
    data_context.setTransform(this.zoomScale, 0, 0, this.zoomScale, 0, 0)
    drawing_context.setTransform(this.zoomScale, 0, 0, this.zoomScale, 0, 0)

    this.drawingService.end(data_context,
      [
        223,
        374,
        224,
        374,
        225,
        374,
        226,
        374,
        227,
        374,
        228,
        373,
        230,
        371,
        235,
        367,
        241,
        359,
        249,
        352,
        260,
        344,
        274,
        335,
        291,
        326,
        312,
        316,
        336,
        305,
        365,
        293,
        395,
        282,
        428,
        269,
        463,
        257,
        495,
        246,
        522,
        237,
        545,
        229,
        565,
        223,
        583,
        218,
        598,
        215,
        609,
        213,
        618,
        211
      ], { type: 'pen', color: 'red', width: '1' })

    this.drawingService.end(data_context,
      [
        41,
        41,
        37,
        41,
        33,
        38,
        28,
        35,
        24,
        33,
        20,
        30,
        18,
        28,
        15,
        26,
        13,
        23,
        11,
        21,
        11,
        18,
        11,
        16,
        11,
        15,
        11,
        14,
        11,
        13,
        13,
        12,
        17,
        11,
        19,
        11,
        21,
        9,
        22,
        9,
        25,
        9,
        28,
        12,
        32,
        16,
        36,
        21,
        39,
        26,
        41,
        30,
        42,
        36,
        42,
        38,
        42,
        41,
        41,
        43,
        40,
        44,
        39,
        45,
        37,
        47,
        36,
        47,
        35,
        47,
        34,
        47,
        32,
        45,
        28,
        41,
        26,
        37,
        25,
        34,
        25,
        31,
        24,
        29,
        24,
        27,
        24,
        25,
        26,
        23,
        28,
        21,
        30,
        20,
        34,
        20,
        36,
        19,
        39,
        19,
        41,
        20,
        42,
        22,
        43,
        25,
        43,
        27,
        43,
        29,
        43,
        31,
        41,
        34,
        40,
        35,
        36,
        36,
        34,
        37,
        33,
        37,
        32,
        37,
        30,
        36,
        28,
        33,
        26,
        30,
        26,
        28,
        26,
        27,
        26,
        25,
        26,
        23,
        28,
        22,
        29,
        22,
        30,
        22,
        32,
        22,
        33,
        22
      ], { type: 'highlighter', color: 'blue', width: '10' })
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
