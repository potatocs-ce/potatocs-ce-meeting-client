import { Injectable } from '@angular/core';
import { DocumentService } from '../document/document.service';
import { CANVAS_CONFIG } from '../../../config/config';
import { DrawingService } from '../drawing/drawing.service';
import { MeetingService } from '../meeting/meeting.service';
@Injectable({
  providedIn: 'root'
})
export class RenderingService {

  constructor(
    private documentService: DocumentService,
    private drawingService: DrawingService,
    private meetingService: MeetingService
  ) { }

  isPageRendering = false;
  pageNumPending: boolean | any = null;

  async renderThumbBackground(imgElement: any, pdfNum: any, pageNum: any) {
    console.log('> renderThumbnail Background');
    const pdfPage = this.documentService.getPdfPage(pdfNum, pageNum);

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

  // renderThumbBoard(thumbCanvas: any, docNum: any, pageNum: any) {
  //   const numPage
  // }


  getThumbnailSize(pdfNum: any, pageNum: any) {
    const pdfPage = this.documentService.getPdfPage(pdfNum, pageNum);
    const viewport = pdfPage.getViewport({ scale: 1 });
    const size = {
      width: 0,
      height: 0,
      scale: 1 // thumbnail draw에서 사용할 scale (thumbnail과 100% pdf size의 비율)
    };

    // landscape 문서 : 가로를 150px(thumbnailMaxSize)로 설정
    if (viewport.width > viewport.height) {
      size.width = CANVAS_CONFIG.thumbnailMaxSize;
      size.height = size.width * viewport.height / viewport.width;
    }
    // portrait 문서 : 세로를 150px(thumbnailMaxSize)로 설정
    else {
      size.height = CANVAS_CONFIG.thumbnailMaxSize;
      size.width = size.height * viewport.width / viewport.height;
    }
    size.scale = size.width / (viewport.width * CANVAS_CONFIG.CSS_UNIT);

    return size;
  }
  /**
   * Teacher Canvas의 board rendering
   * @param {element} targetCanvas canvas element
   * @param {number} zoomScale zoomScale
   * @param {Object} drawingEvents 판서 event (tool, points, timeDiff)
   */
  renderBoard(targetCanvas: any, zoomScale: any, drawingEvents: any) {
    console.log('>> render Board: ', drawingEvents)
    const targetCtx = targetCanvas.getContext('2d');
    const scale = zoomScale || 1;
    console.log(zoomScale, targetCanvas.width / scale, targetCanvas.height / scale)

    targetCtx.clearRect(0, 0, targetCanvas.width / scale, targetCanvas.height / scale);
    /*----------------------------------------
      해당 page의 drawing 정보가 있는 경우
      drawing Service의 'end'관련 event 이용.
    -----------------------------------------*/

    // console.log('draw --------------------', drawingEvents)
    if (drawingEvents && drawingEvents.length > 0) {

      for (const item of drawingEvents) {
        if (!this.meetingService.skipList().includes(item.userId)) {
          this.drawingService.end(targetCtx, item.drawingEvent.points, item.drawingEvent.tool, item.txt, scale);
        }
      }
    }
  }

  async renderBackground(tmpCanvas: any, bgCanvas: any, pdfNum: any, pageNum: any) {
    console.log(`>>>> renderBackground, pdfNum: ${pdfNum}, pageNum: ${pageNum}`);


    if (this.isPageRendering) {
      console.log(' ---> pending!!! ');
      this.pageNumPending = pageNum;
    } else {
      this.isPageRendering = true;

      const pdfPage = this.documentService.getPdfPage(pdfNum + 1, pageNum);

      if (!pdfPage) {
        return;
      }

      await this.rendering(pdfPage, bgCanvas, tmpCanvas);

      this.isPageRendering = false;

      if (this.pageNumPending) {
        this.renderBackground(tmpCanvas, bgCanvas, pdfNum, this.pageNumPending);
        this.pageNumPending = null;
      }
    }
  }

  async rendering(page: any, targetCanvas: any, tmpCanvas: any) {
    if (!page) return false;

    const viewport = page.getViewport({ scale: 1 });
    const ctx = targetCanvas.getContext('2d');

    const bgImgSize = { width: targetCanvas.width, height: targetCanvas.height }


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

      // tmpCanvas.width = viewport.width;
      // tmpCanvas.height = viewport.height;

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
