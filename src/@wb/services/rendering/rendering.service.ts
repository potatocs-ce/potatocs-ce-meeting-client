import { ElementRef, Injectable, ViewChild, Renderer2, RendererFactory2 } from '@angular/core';
import { PdfStorageService } from '../../storage/pdf-storage.service';
import { CANVAS_CONFIG } from '../../config/config';
import { DrawingService } from '../drawing/drawing.service';
import { DrawStorageService } from '../../storage/draw-storage.service';
import { SelectedViewInfoService } from 'src/@wb/store/selected-view-info.service';



@Injectable({
    providedIn: 'root'
})
export class RenderingService {


    constructor(
        private pdfStorageService: PdfStorageService,
        private drawingService: DrawingService,
        private drawStorageService: DrawStorageService,
        private selectedViewInfoService: SelectedViewInfoService,
    ) { }

    isPageRendering = false;
    pageNumPending: boolean = null;


    /**
     * Thumbnail의 배경 rendering
     * - canvas 대신 image 처리로 변경
     * @param {element} imgElement <img>
     * @param {number} pageNum 페이지 번호
     * @param {element} canvas <canvas>
     */
    async renderThumbBackground(imgElement, pdfNum, pageNum) {
        // console.log('> renderThumbnail Background');
        const pdfPage = this.pdfStorageService.getPdfPage(pdfNum, pageNum);

        // console.log(pdfPage)
        // 배경 처리를 위한 임시 canvas
        const tmpCanvas = document.createElement('canvas');
        const tmpCtx = tmpCanvas.getContext("2d");

        // 1/2 scale로 설정 (임시)
        const viewport = pdfPage.getViewport({ scale: 0.5 });
        tmpCanvas.width = viewport.width;
        tmpCanvas.height = viewport.height;

        try {
            const renderContext = {
                canvasContext: tmpCtx,
                viewport
            };
            /*-----------------------------------
              pdf -> tmpCanvas -> image element
              ! onload event는 굳이 필요없음.
            ------------------------------------*/
            await pdfPage.render(renderContext).promise;
            imgElement.src = tmpCanvas.toDataURL();

            return true;

        } catch (err) {
            console.log(err);
            return false;
        }
    }

    /**
     * 1. Thumbnail의 보드 rendering
     *  --> GSTD Open시 board 전체를 새로 그리는 기능
     * 2. monitoring mode에서 그리는 용도로 사용
     *
     * - !실시간 drawing은 canvasService에서 처리
     *
     * @param {element} thumbCanvas thumbnail canvas element
     * @param {number} pageNum 페이지 번호
     * @param {Object} data drawing data (tool, timediff, points)
     */
    renderThumbBoard(thumbCanvas, docNum, pageNum, isSelectedViewMode, selectedUserInfo) {
        let drawingEvents = this.drawStorageService.getDrawingEvents(docNum, pageNum);

        // 사용자별 판서 모드 일 경우 선택된 사용자의 드로우 이벤트만 남김.
        if (isSelectedViewMode) {
            drawingEvents = {
                ...drawingEvents, drawingEvent: drawingEvents?.drawingEvent.filter(e => {
                    return selectedUserInfo.some(x => {
                        if ((e.userId === x.selectedUserId) && x.isSelected === true) return e
                    });
                })
            }

            // 사용자별 판서에 드로우 이벤트가 없으면 그냥 지워
            if (drawingEvents?.drawingEvent?.length === 0) {
                const thumbCtx = thumbCanvas.getContext('2d');
                thumbCtx.clearRect(0, 0, thumbCanvas.width, thumbCanvas.height);
                thumbCtx.save();
            }
        }

        // 해당 page의 drawing 정보가 있는 경우
        if (drawingEvents?.drawingEvent?.length > 0) {
            const viewport = this.pdfStorageService.getViewportSize(docNum, pageNum);
            const scale = thumbCanvas.width / (viewport.width * CANVAS_CONFIG.CSS_UNIT);

            const thumbCtx = thumbCanvas.getContext('2d');

            thumbCtx.clearRect(0, 0, thumbCanvas.width, thumbCanvas.height);
            thumbCtx.save();
            thumbCtx.scale(scale, scale);
            // console.log(thumbCanvas.width, viewport.width);
            for (const item of drawingEvents?.drawingEvent) {
                // Draw Service의 'end'관련 event 이용.
                this.drawingService.end(thumbCtx, item.points, item.tool, item.txt, scale);
            }
            thumbCtx.restore();
        }
    }


    /**
     * Main Board의 Background rendering
     * - pending 처리 포함
     * @param pageNum page 번호
     */
    async renderBackground(tmpCanvas, bgCanvas, pdfNum, pageNum) {
        console.log(`>>>> renderBackground, pdfNum: ${pdfNum}, pageNum: ${pageNum}`);

        const pdfPage = this.pdfStorageService.getPdfPage(pdfNum, pageNum);
        if (!pdfPage) {
            return;
        }

        if (this.isPageRendering) {
            // console.log(' ---> pending!!! ');
            this.pageNumPending = pageNum;
        } else {
            this.isPageRendering = true;

            await this.rendering(pdfPage, bgCanvas, tmpCanvas);

            this.isPageRendering = false;

            if (this.pageNumPending) {
                this.renderBackground(tmpCanvas, bgCanvas, pdfNum, this.pageNumPending);
                this.pageNumPending = null;
            }
        }
    }

    /**
     * Teacher Canvas의 board rendering
     * @param {element} targetCanvas canvas element
     * @param {number} zoomScale zoomScale
     * @param {Object} drawingEvents 판서 event (tool, points, timeDiff)
     */
    renderBoard(targetCanvas, zoomScale, drawingEvents) {
        console.log('>> render Board: ', drawingEvents?.drawingEvent)
        // console.log('select:', this.selectedViewInfoService.state.isSelectedViewMode)
        // if (this.selectedViewInfoService.state.isSelectedViewMode) {
        //     drawingEvents?.drawingEvent.filter((event) => event.userId === this.selectedViewInfoService.state.selectedUserId)
        // }

        const targetCtx = targetCanvas.getContext('2d');
        const scale = zoomScale || 1;
        targetCtx.clearRect(0, 0, targetCanvas.width / scale, targetCanvas.height / scale);
        /*----------------------------------------
          해당 page의 drawing 정보가 있는 경우
          drawing Service의 'end'관련 event 이용.
        -----------------------------------------*/

        // console.log('draw --------------------', drawingEvents)
        if (drawingEvents?.drawingEvent && drawingEvents?.drawingEvent.length > 0) {
            // console.log('renderBoard -------------------222222222')
            for (const item of drawingEvents?.drawingEvent) {
                this.drawingService.end(targetCtx, item.points, item.tool, item.txt, scale);
            }
        }
    }

    /**
     * 공통 Rendering function
     * - tmpcanvas를 이용해서 target Canvas에 pdf draw
     * - 동일 size로 바로 rendering하는 경우 quality가 좋지 않음. (특히 text 문서의 경우.)
     * - pdf -> tmpCanvas -> targetCanvas
     * @param {pdfPage} page  pdfPage
     * @param {element} targetCanvas bgcanvas
     */
    async rendering(page, targetCanvas, tmpCanvas) {

        if (!page) {
            return false;
        }

        const viewport = page.getViewport({ scale: 1 });
        const ctx = targetCanvas.getContext('2d');

        const bgImgSize = { width: targetCanvas.width, height: targetCanvas.height };

        try {
            const scale = targetCanvas.width / viewport.width;
            let tmpCanvasScaling;

            // scale이 작을때만 tmpcanvas size increase... : 여러가지 추가 check. ~~ todo
            if (scale <= 2 * CANVAS_CONFIG.CSS_UNIT) {
                tmpCanvasScaling = Math.max(2, CANVAS_CONFIG.deviceScale);
            } else {
                tmpCanvasScaling = CANVAS_CONFIG.deviceScale;
            }

            // console.log('bgimgsize: ', bgImgSize);
            // console.log('device scale: ', CONFIG.deviceScale);

            // console.log('tmp canvas scaling: ', tmpCanvasScaling);

            tmpCanvas.width = bgImgSize.width * tmpCanvasScaling / CANVAS_CONFIG.deviceScale;
            tmpCanvas.height = bgImgSize.height * tmpCanvasScaling / CANVAS_CONFIG.deviceScale;

            // console.log('rendering tmpcanvas: ', tmpCanvas);

            const zoomScale = tmpCanvas.width / viewport.width;
            const tmpCtx = tmpCanvas.getContext('2d');
            const renderContext = {
                canvasContext: tmpCtx,
                viewport: page.getViewport({ scale: zoomScale })
            };

            // tmpCanvas에 pdf 그리기
            await page.render(renderContext).promise;

            /*-------------------------------------------------
              tmpCanvas => target Canvas copy
              --> 대기중인 image가 없는 경우에만 처리.
              ---> pre-render 기능을 사용하므로 최종 image만 그려주면 됨.
            -----------------------------------------------------------*/
            if (!this.pageNumPending) {
                ctx.drawImage(tmpCanvas, 0, 0, bgImgSize.width, bgImgSize.height);
                // clear tmpCtx
                tmpCtx.clearRect(0, 0, tmpCtx.width, tmpCtx.height);
            }

            return true;

        } catch (err) {
            console.log(err);
            return false;
        }
    }

}



