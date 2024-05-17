import { Component, ElementRef, HostListener, NgZone, ViewChild, effect } from '@angular/core';
import { DocumentService } from '../../services/document/document.service';
import * as pdfjsLib from 'pdfjs-dist';
import { RenderingService } from '../../services/rendering/rendering.service';

import { CANVAS_CONFIG } from '../../../config/config';
import { CanvasService } from '../../services/canvas/canvas.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { ZoomService } from '../../services/zoom/zoom.service';

@Component({
  selector: 'app-whiteboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: './whiteboard.component.html',
  styleUrl: './whiteboard.component.scss'
})
export class WhiteboardComponent {
  docInfo: any = {};
  lastPage: number = 0;
  zoomScale: number = 1;


  @ViewChild('canvasContainer', { static: true }) public canvasContainerRef: ElementRef | any;
  @ViewChild('canvasCover', { static: true }) public coverCanvasRef: ElementRef | any;
  @ViewChild('userCanvas', { static: true }) public userCanvasRef: ElementRef | any;
  @ViewChild('rxCanvasCover', { static: true }) public rxCoverCanvasRef: ElementRef | any;
  @ViewChild('bg', { static: true }) public bgCanvasRef: ElementRef | any;
  @ViewChild('tmp', { static: true }) public tmpCanvasRef: ElementRef | any;


  @ViewChild('whiteboardSection', { static: true }) public whiteboardSectionRef: ElementRef | any;

  canvasContainer: HTMLDivElement | any;
  coverCanvas: HTMLCanvasElement | any;

  userCanvas: HTMLCanvasElement | any;
  rxCanvasCover: HTMLCanvasElement | any;

  bgCanvas: HTMLCanvasElement | any;
  tmpCanvas: HTMLCanvasElement | any;


  whiteboardSection: HTMLDivElement | any;



  // 그리기 도구용 변수
  tool: any = { type: 'pen', color: 'black' }



  constructor(
    private docService: DocumentService,
    private renderingService: RenderingService,
    private canvasService: CanvasService,
    private zone: NgZone,
    private zoomService: ZoomService
  ) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = './assets/lib/pdf/pdf.worker.js';
    effect(() => {
      this.lastPage = this.docService.pageBuffer()[this.docService.lastDocNum()]
      this.docInfo = this.docService._docList()[this.docService.lastDocNum()];
      this.zoomScale = this.zoomService.zoomScale();
      if (this.docInfo)
        this.pageRender(this.docService.lastDocNum(), this.lastPage, this.zoomScale)
    })
  }


  /**
   * 초기 세팅
   */
  ngOnInit(): void {
    this.initCanvasSet();
  }

  /**
   * 특정 컨테이너의 크기 변경 감지
   */
  observer: any;
  observer_target: any;
  ngAfterViewInit() {
    this.observer = new ResizeObserver(entries => {
      this.zone.run(() => {
        this.initCanvasSet();
      });
    });

    this.observer_target = this.whiteboardSection;

    this.observer.observe(this.observer_target);
  }

  ngOnDestroy() {
    this.observer.unobserve(this.observer_target);
  }

  /**
   * 초기 canvas 변수, container size 설정
   */
  initCanvasSet() {
    this.tmpCanvas = this.tmpCanvasRef.nativeElement;
    this.bgCanvas = this.bgCanvasRef.nativeElement;
    this.canvasContainer = this.canvasContainerRef.nativeElement;
    this.coverCanvas = this.coverCanvasRef.nativeElement;
    this.userCanvas = this.userCanvasRef.nativeElement;
    this.rxCanvasCover = this.rxCoverCanvasRef.nativeElement;

    this.whiteboardSection = this.whiteboardSectionRef.nativeElement;

    CANVAS_CONFIG.maxContainerHeight = this.whiteboardSection.clientHeight;
    CANVAS_CONFIG.maxContainerWidth = this.whiteboardSection.clientWidth;
  }

  @HostListener('window:resize') resize() {

    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    // sidenav 열릴때 resize event 발생... 방지용도.
    if (CANVAS_CONFIG.maxContainerWidth === newWidth && CANVAS_CONFIG.maxContainerHeight === newHeight) {
      return;
    }
    CANVAS_CONFIG.maxContainerWidth = newWidth;
    CANVAS_CONFIG.maxContainerHeight = newHeight;
    this.onResize();
  }

  onResize() {

    // Resize시 container size 조절.
    const ratio = this.canvasService.setContainerSize(this.coverCanvas, this.canvasContainer);

    // if (this.viewInfoService.state.leftSideView != 'thumbnail') return;

    // thumbnail window 크기 변경을 위한 처리.
    // this.eventBusService.emit(new EventData("change:containerSize", {
    //   ratio,
    //   coverWidth: this.coverCanvas.width,
    // }));

  }

  /**
   * Scroll 발생 시
   */
  onScroll() {
    // if (this.viewInfoService.state.leftSideView != 'thumbnail') return;

    // this.eventBusService.emit(new EventData('change:containerScroll', {
    //   left: this.canvasContainer.scrollLeft,
    //   top: this.canvasContainer.scrollTop
    // }))
  }


  /**
   * 캔버스를 그리는데 필요한 각 캔버스 들의 사이즈를 결정하는 함수 
   * @param currentDocNum 현재 문서 번호
   * @param currentPage 문서의 페이지 번호
   * @param zoomScale 스케일 정보 
   */
  setCanvasSize(currentDocNum: number, currentPage: number, zoomScale: number) {
    return this.canvasService.setCanvasSize(currentDocNum, currentPage, zoomScale, this.canvasContainer, this.coverCanvas, this.rxCanvasCover, this.userCanvas, this.bgCanvas);
  }


  async pageRender(currentDocNum: number, currentPage: number, zoomScale: number) {

    // set Canvas Size
    const ratio = this.setCanvasSize(currentDocNum, currentPage, zoomScale);
    // pdf 판서 표현 용도
    await this.renderingService.renderBackground(this.tmpCanvas, this.bgCanvas, currentDocNum, currentPage)
  }




  //=====================그리기 함수

  /**
   * 타입 지정 함수
   * @param type 지정할 타입
   */
  setType(type: string) {
    this.tool.type = type;

    if (type == 'highlighter' && this.tool.color == 'black') {
      this.tool.color = 'yellow'
    }
  }

  /**
 * 색 지정 함수
 * @param color 색
 */
  setColor(color: string) {
    this.tool.color = color;
    // this.toolService.tool.set({ ...this.tool })
    // this.setCanvas()
  }

  /**
   * 팬 두께 지정
   * @param width 두께
   */
  setWidth(width: number) {
    this.tool.width = width;

    // this.toolService.tool.set({ ...this.tool })
    // this.setCanvas()
  }

  clearDrawing() {
    // 여기 한 번 확인 물어보는 로직 추가
    if (window.confirm('Do you want to delete all drawings on the current page?')) {
      // this.meetingApiService.clearVideoDrawing(this.meetingService.meeting_room_id(), this.videoStream?.user_id).subscribe((res: any) => {
      //   if (res.message == 'success') {
      //     // 여기서 userId 판서 정보 일단 다 지우기
      //     this.videoDrawingService.drawVarArray()[this.videoStream?.user_id] = [];
      //     const video_target: any = document.getElementById('data_canvas');
      //     const target_context: any = video_target.getContext('2d');
      //     target_context.clearRect(0, 0, video_target.width, video_target.height);
      //     this.socket.emit('draw:video_clear', { room_id: this.meetingService.meeting_room_id(), target_id: video_target.parentNode.id, meeting_id: this.meetingService.meeting_room_id() })
      //   }
      // })
    }
  }


  clickZoom(action: any) {
    console.log(">> Click Zoom: ", action);

    const docNum = this.docService.lastDocNum();
    const currentPage = this.docService.pageBuffer()[docNum];
    const prevZoomScale = this.zoomService.zoomScale();

    const newZoomScale = this.zoomService.calcZoomScale(action, docNum, currentPage, prevZoomScale);
    // zoomScale 업데이트
    this.zoomService.zoomScale.set(newZoomScale);
  }
}
