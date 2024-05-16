import { Component, ElementRef, HostListener, NgZone, ViewChild, effect } from '@angular/core';
import { DocumentService } from '../../services/document/document.service';
import * as pdfjsLib from 'pdfjs-dist';
import { RenderingService } from '../../services/rendering/rendering.service';

import { CANVAS_CONFIG } from '../../../config/config';
import { CanvasService } from '../../services/canvas/canvas.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-whiteboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './whiteboard.component.html',
  styleUrl: './whiteboard.component.scss'
})
export class WhiteboardComponent {
  docInfo: any = {};
  lastPage: number = 0;


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


  constructor(
    private docService: DocumentService,
    private renderingService: RenderingService,
    private canvasService: CanvasService,
    private zone: NgZone,

  ) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = './assets/lib/pdf/pdf.worker.js';
    effect(() => {
      this.lastPage = this.docService.pageBuffer()[this.docService.lastDocNum()]
      this.docInfo = this.docService._docList()[this.docService.lastDocNum()];

      if (this.docInfo)
        this.pageRender(this.docService.lastDocNum(), this.lastPage, 1)
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
    console.log(this.canvasContainer)
    // set Canvas Size
    const ratio = this.setCanvasSize(currentDocNum, currentPage, zoomScale);
    // pdf 판서 표현 용도
    await this.renderingService.renderBackground(this.tmpCanvas, this.bgCanvas, currentDocNum, currentPage)
  }


}
