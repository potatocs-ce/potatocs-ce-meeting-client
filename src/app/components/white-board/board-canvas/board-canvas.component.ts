import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, OnInit, Renderer2, ViewChild, HostListener, ɵɵtrustConstantResourceUrl } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, Subject, fromEvent } from 'rxjs';
import { pluck, takeUntil, distinctUntilChanged, debounceTime, pairwise } from 'rxjs/operators';

import { CANVAS_CONFIG } from 'src/@wb/config/config';

import { CanvasService } from 'src/@wb/services/canvas/canvas.service';
import { RenderingService } from 'src/@wb/services/rendering/rendering.service';
import { DrawingService } from 'src/@wb/services/drawing/drawing.service';

import { EventBusService } from 'src/@wb/services/eventBus/event-bus.service';
import { EventData } from 'src/@wb/services/eventBus/event.class';

import { PdfStorageService } from 'src/@wb/storage/pdf-storage.service';
import { DrawStorageService } from 'src/@wb/storage/draw-storage.service';

import { ViewInfoService } from 'src/@wb/store/view-info.service';
import { EditInfoService } from 'src/@wb/store/edit-info.service';



export interface DialogData {
    title: string;
    content: string;
}

@Component({
    selector: 'app-board-canvas',
    templateUrl: './board-canvas.component.html',
    styleUrls: ['./board-canvas.component.scss']
})
export class BoardCanvasComponent implements OnInit, OnDestroy {

    private unsubscribe$ = new Subject<void>();

    editDisabled = true;
    dragOn = true;
    currentToolInfo = {
        type: '',
        color: '',
        width: '',
    };

    private currentDocNum: any;
    private currentPage: any;

    // preRendering을 위한 변수
    prevViewInfo; //'fileList', 'thumbnail';

    // ************* Subject
    canvasClearBoardA$;

    // ************* Subject

    // static: https://stackoverflow.com/questions/56359504/how-should-i-use-the-new-static-option-for-viewchild-in-angular-8
    @ViewChild('canvasContainer', { static: true }) public canvasContainerRef: ElementRef;
    @ViewChild('canvasCover', { static: true }) public coverCanvasRef: ElementRef;
    @ViewChild('teacherCanvas', { static: true }) public teacherCanvasRef: ElementRef;
    @ViewChild('rxCanvasCover', { static: true }) public rxCoverCanvasRef: ElementRef;
    @ViewChild('bg', { static: true }) public bgCanvasRef: ElementRef;
    @ViewChild('tmp', { static: true }) public tmpCanvasRef: ElementRef;


    canvasContainer: HTMLDivElement;
    coverCanvas: HTMLCanvasElement;
    teacherCanvas: HTMLCanvasElement;
    rxCoverCanvas: HTMLCanvasElement;
    bgCanvas: HTMLCanvasElement;
    tmpCanvas: HTMLCanvasElement;


    rendererEvent1: any;

    constructor(
        private viewInfoService: ViewInfoService,
        private editInfoService: EditInfoService,

        private canvasService: CanvasService,
        private pdfStorageService: PdfStorageService,
        private renderingService: RenderingService,
        private eventBusService: EventBusService,
        private renderer: Renderer2,
        private drawStorageService: DrawStorageService,
        private drawingService: DrawingService,

    ) {
        this.canvasClearBoardA$ = this.canvasService.getClearBoardA$();

    }

    // Resize Event Listener
    @HostListener('window:resize') resize() {
        const newWidth = window.innerWidth - CANVAS_CONFIG.sidebarWidth;
        const newHeight = window.innerHeight - CANVAS_CONFIG.navbarHeight;
        // sidenav 열릴때 resize event 발생... 방지용도.
        if (CANVAS_CONFIG.maxContainerWidth === newWidth && CANVAS_CONFIG.maxContainerHeight === newHeight) {
            return;
        }
        CANVAS_CONFIG.maxContainerWidth = newWidth;
        CANVAS_CONFIG.maxContainerHeight = newHeight;
        this.onResize();
    }

    ngOnInit(): void {

        this.initCanvasSet();

        ////////////////////////////////////////////////
        // Document가 Update 된 경우
        this.viewInfoService.state$
            .pipe(takeUntil(this.unsubscribe$), pluck('pageInfo'), distinctUntilChanged())
            .subscribe((pageInfo) => {
                console.log(pageInfo)
                this.currentDocNum = pageInfo.currentDocNum;
                this.currentPage = pageInfo.currentPage;
                // 초기 load 포함 변경사항에 대해 수행
                // (doc change, page change, zoom change 등)
                if (pageInfo.currentDocId) {
                    this.onChangePage();
                }
            });


        ///////////////////////////////////////////////

        ////////////////////////////////////////////////
        // 현재 sideBar view 정보 받아오기
        this.viewInfoService.state$
            .pipe(takeUntil(this.unsubscribe$), distinctUntilChanged(), pairwise())
            .subscribe(([prevViewInfo, viewInfo]) => {

                console.log(prevViewInfo.leftSideView)

                // 현재 sideBar doc. view 정보 받아서 저장.
                this.prevViewInfo = prevViewInfo.leftSideView


            });

        ///////////////////////////////////////////////

        // Tool update(nav Menu)에 따른 event handler 변경

        this.editInfoService.state$
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((editInfo) => {
                console.log('[Editor Setting]: ', editInfo);

                this.editDisabled = editInfo.toolDisabled || editInfo.editDisabled;

                // drag Enable
                this.dragOn = false;
                if (editInfo.mode == 'move') this.dragOn = true;

                const currentTool = editInfo.tool;
                this.currentToolInfo = {
                    type: editInfo.tool, // pen/eraser
                    color: editInfo.toolsConfig[currentTool].color,
                    width: editInfo.toolsConfig[currentTool].width
                };

                const zoomScale = this.viewInfoService.state.pageInfo.zoomScale;

                // text모드에서 갑작스럽게 다른 모드로 전환할경우
                // textarea 삭제
                if (editInfo.tool != 'text') {
                    var textInput = (<HTMLInputElement>document.getElementById('textarea'));
                    if (textInput) {
                        textInput.parentNode.removeChild(textInput);
                    }
                }

                this.canvasService.addEventHandler(this.coverCanvas, this.teacherCanvas, this.currentToolInfo, zoomScale);
            });

        //////////////////////////////////////////////////


        /////////////////////////////////////
        // 다른 참가자가 draw event를 발생시켰을때의 Listener
        // 판서 표시
        this.eventBusService.on('receive:drawEvent', this.unsubscribe$, async (data) => {
            const pageInfo = this.viewInfoService.state.pageInfo;
            //document Number -> 1부터 시작.
            const docNum = pageInfo.currentDocNum;
            const pageNum = pageInfo.currentPage;
            const zoomScale = pageInfo.zoomScale;

            console.log(data.drawingEvent)
            if (docNum == data.docNum && pageNum == data.pageNum) {
                if (data.drawingEvent.tool.type == 'pointer') {
                    this.drawingService.rxPointer(data.drawingEvent, this.rxCoverCanvas, this.teacherCanvas, zoomScale, docNum, pageNum);
                } else if (data.drawingEvent.tool.type == 'pointerEnd') {
                    const context = this.rxCoverCanvas.getContext("2d");
                    context.shadowColor = "";
                    context.shadowBlur = 0;
                    context.clearRect(0, 0, this.rxCoverCanvas.width / zoomScale, this.rxCoverCanvas.height / zoomScale);
                }
                else {
                    this.drawingService.rxDrawing(data.drawingEvent, this.rxCoverCanvas, this.teacherCanvas, zoomScale, docNum, pageNum);
                }
            }
        });
        /////////////////////////////////////////////////////////////

        //~~~ 판서 전체 삭제 루틴:  추가 변경 해야함
        this.eventBusService.on('rmoveDrawEventPageRendering', this.unsubscribe$, (data) => {
            const viewInfo = this.viewInfoService.state;
            const docNum = viewInfo.pageInfo.currentDocNum;
            const pageNum = viewInfo.pageInfo.currentPage;
            const zoomScale = viewInfo.pageInfo.zoomScale;

            if (this.currentDocNum == docNum && this.currentPage == pageNum) {
                this.pageRender(docNum, pageNum, zoomScale)
            }
        })
        ///////////////////////////////////////////////

        /////////////////////////////////////
        // 다른 참가자가 receive:clearDrawEvent를 발생시켰을때의 Listener
        // 판서 표시
        this.eventBusService.on('receive:clearDrawEvent', this.unsubscribe$, async (data) => {
            const pageInfo = this.viewInfoService.state.pageInfo;
            //document Number -> 1부터 시작.
            const docNum = pageInfo.currentDocNum;
            const pageNum = pageInfo.currentPage;
            const zoomScale = pageInfo.zoomScale;

            if (docNum == data.currentDocNum && pageNum == data.currentPage) {
                this.pageRender(docNum, pageNum, zoomScale)
            }
        });
        /////////////////////////////////////////////////////////////

        ///////////////////////////////////////////////////
        // continer scroll
        // thumbnail의 window 처리 용도
        this.rendererEvent1 = this.renderer.listen(this.canvasContainer, 'scroll', event => {
            this.onScroll();
        });
        ////////////////////////////////////////////////

        /////////////////////////////////////////////////////////////
        //~~~ 판서 전체 삭제 루틴:  추가 변경 해야함
        // this.canvasClearBoardA$.pipe(takeUntil(this.unsubscribe$)).subscribe((text: string) => {

        //   const confirmResult = confirm('처음부터 다시 그리시겠습니까?');

        //   if (confirmResult === true) {
        //     console.log(' ---> init drawing');
        //     // this.canvasService.recordingClear();

        //     // tool 초기화 --> 새로운 event data 처음 처리.
        //     // this.changeTool('pen', 'black');
        //   } else {
        //     return;
        //   }

        // });



    }
    // end of ngOnInit



    ngOnDestroy() {
        // this.canvasService.releaseEventHandler();

        this.unsubscribe$.next();
        this.unsubscribe$.complete();

        // render listener 해제
        this.rendererEvent1();

        // pdf memory release
        this.pdfStorageService.memoryRelease();

    }


    /**
     * 초기 Canvas 변수, Container Size 설정
     */
    initCanvasSet() {

        this.coverCanvas = this.coverCanvasRef.nativeElement;
        this.rxCoverCanvas = this.rxCoverCanvasRef.nativeElement;

        this.teacherCanvas = this.teacherCanvasRef.nativeElement;
        this.bgCanvas = this.bgCanvasRef.nativeElement;

        this.tmpCanvas = this.tmpCanvasRef.nativeElement;
        this.canvasContainer = this.canvasContainerRef.nativeElement;

        /* container size 설정 */
        CANVAS_CONFIG.maxContainerHeight = window.innerHeight - CANVAS_CONFIG.navbarHeight; // pdf 불러오기 사이즈
        CANVAS_CONFIG.maxContainerWidth = window.innerWidth - CANVAS_CONFIG.sidebarWidth;

        CANVAS_CONFIG.deviceScale = this.canvasService.getDeviceScale(this.coverCanvas);
    }


    /**
     *  판서 + background drawing
     */

    /**
     * draw + pdf rendering
     *
     * @param currentDocNum
     * @param currentPage
     * @param zoomScale
     */
    async pageRender(currentDocNum, currentPage, zoomScale) {

        // 화면을 급하게 확대하거나 축소 시 깜빡거리는 UI 측면 문제 해결 위한 함수
        this.preRenderBackground(currentPage)

        console.log('>>> page Render! [background and board] + addEventHandler');

        // board rendering
        const drawingEvents = this.drawStorageService.getDrawingEvents(currentDocNum, currentPage);
        // console.log(drawingEvents)
        this.renderingService.renderBoard(this.teacherCanvas, zoomScale, drawingEvents);

        // PDF Rendering
        await this.renderingService.renderBackground(this.tmpCanvas, this.bgCanvas, currentDocNum, currentPage);
    }


    /**
     * Background pre rendering
     * - Main bg를 그리기 전에 thumbnail image 기준으로 배경을 미리 그림.
     * - UI 측면의 효과
     * @param pageNum page 번호
     */
    preRenderBackground(pageNum) {
        const targetCanvas = this.bgCanvas
        const ctx = targetCanvas.getContext("2d");
        const imgElement: any = document.getElementById('thumb_' + pageNum);

        /**************************************************
        * 처음 화이트보드에 들어오면 thumbnail view 아니라 fileList view이기 때문에
        * document.getElementById('thumb_' + pageNum) (이미지)가 정의되지 않아 오류가 난다.
        * 그래서 doc을 클릭하여 thumbnail view 일 경우에만 실행하도록 설정함.
        ****************************************************/
        if (this.prevViewInfo === 'thumbnail') {
            ctx.drawImage(imgElement, 0, 0, targetCanvas.width, targetCanvas.height);
        }
    }



    /**
     * Canvas size 설정
     *
     * @param currentDocNum
     * @param currentPage
     * @param zoomScale
     * @returns
     */
    setCanvasSize(currentDocNum, currentPage, zoomScale) {
        return this.canvasService.setCanvasSize(currentDocNum, currentPage, zoomScale, this.canvasContainer, this.coverCanvas, this.rxCoverCanvas, this.teacherCanvas, this.bgCanvas);
    }

    /**
     * 창 크기 변경시
     *
     */
    onResize() {
        // Resize시 container size 조절.
        const ratio = this.canvasService.setContainerSize(this.coverCanvas, this.canvasContainer);

        if (this.viewInfoService.state.leftSideView != 'thumbnail') return;

        // thumbnail window 크기 변경을 위한 처리.
        this.eventBusService.emit(new EventData("change:containerSize", {
            ratio,
            coverWidth: this.coverCanvas.width,
        }));

    }

    /**
     * Scroll 발생 시
     */
    onScroll() {
        if (this.viewInfoService.state.leftSideView != 'thumbnail') return;

        this.eventBusService.emit(new EventData('change:containerScroll', {
            left: this.canvasContainer.scrollLeft,
            top: this.canvasContainer.scrollTop
        }))
    }


    /**
       * change Page : 아래 사항에 대해 공통으로 사용
       * - 최초 Load된 경우
       * - 페이지 변경하는 경우
       * - 문서 변경하는 경우
       * - scale 변경하는 경우
       */
    onChangePage() {

        const pageInfo = this.viewInfoService.state.pageInfo;

        //document Number -> 1부터 시작.
        const docNum = pageInfo.currentDocNum;
        const pageNum = pageInfo.currentPage;
        const zoomScale = pageInfo.zoomScale;

        console.log(`>> changePage to doc: ${docNum}, page: ${pageNum}, scale: ${zoomScale} `);

        // 기존의 rx drawing event 삭제: 다른 page에 그려지는 현상 방지
        this.drawingService.stopRxDrawing();

        // set Canvas Size
        const ratio = this.setCanvasSize(docNum, pageNum, zoomScale);

        // BG & Board Render
        this.pageRender(docNum, pageNum, zoomScale);


        // Canvas Event Set
        this.canvasService.addEventHandler(this.coverCanvas, this.teacherCanvas, this.currentToolInfo, zoomScale);

        // Thumbnail window 조정
        if (this.viewInfoService.state.leftSideView === 'thumbnail') {
            this.eventBusService.emit(new EventData('change:containerSize', {
                ratio,
                coverWidth: this.coverCanvas.width,
            }));
        }

        // scroll bar가 있는 경우 page 전환 시 초기 위치로 변경
        this.canvasContainer.scrollTop = 0;
        this.canvasContainer.scrollLeft = 0;
    };




}

