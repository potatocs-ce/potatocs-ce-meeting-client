import { Injectable } from '@angular/core';
import { CANVAS_CONFIG } from '../../config/config';
import { PdfStorageService } from '../../storage/pdf-storage.service';

@Injectable({
  providedIn: 'root'
})
export class ZoomService {

  maxZoomScale = CANVAS_CONFIG.maxZoomScale;
  minZoomScale = CANVAS_CONFIG.minZoomScale;

  constructor(
    private pdfStorageService: PdfStorageService,
  ) { }

  /**
   *
   * @param pageNum 새로 로드하는 문서의 첫 페이지 번호
   * 1. main container size보다 큰 경우 -> fit to page
   * 2. landscape 문서인 경우(가로가 긴 문서) -> fit to page
   * 3. portrait 문서인 경우(세로가 긴 문서) -> 100%
   *
   */
  setInitZoomScale() {
    console.log('> Calc init Zoom scale...');
    const containerSize = {
      width: CANVAS_CONFIG.maxContainerWidth,
      height: CANVAS_CONFIG.maxContainerHeight
    };
    const pdfPage: any = this.pdfStorageService.getPdfPage(1, 1);
    // console.log(pdfPage)
    const docSize = pdfPage.getViewport({ scale: 1 * CANVAS_CONFIG.CSS_UNIT }); // 100%에 해당하는 document의 size (Css 기준)

    const ratio = {
      w: containerSize.width / docSize.width,
      h: containerSize.height / docSize.height
    };
    // console.log(ratio)

    let zoomScale = 1;

    // 1. main container size보다 작은 경우
    if (ratio.w >= 1 && ratio.h >= 1) {
      // console.log(' - 문서가 container보다 작음.');
      // fit To page
      zoomScale = Math.min(ratio.w, ratio.h);
    }

    // 2. landscape 문서인 경우
    else if (docSize.width > docSize.height) {
      // console.log(' - 문서: Landscape');
      // fit To Page
      zoomScale = Math.min(ratio.w, ratio.h);
    }
    // 3, portrait 문서인 경우
    else if (docSize.width <= docSize.height) {
      // console.log(' - 문서: Portrait');
      if (ratio.w < 1) {
        // console.log(' - 문서 Width가 container보다 넓습니다.');
        zoomScale = ratio.w;
      }
    }

    zoomScale = Math.min(zoomScale, this.maxZoomScale);
    zoomScale = Math.max(zoomScale, this.minZoomScale);

    console.log(' - Init zoom Scale : ', zoomScale);

    return zoomScale;
  }

  // zoomscale 결정(zoomin, zoomout, fit to page .... etc)
  calcZoomScale(zoomInfo, docNum, pageNum, prevZoomScale = 1) {

    let zoomScale = 1;

    switch (zoomInfo) {
      case 'zoomIn':
        zoomScale = this.calcNewZoomScale(prevZoomScale, +1);
        break;

      case 'zoomOut':
        zoomScale = this.calcNewZoomScale(prevZoomScale, -1);
        break;

      // 너비에 맞춤
      case 'fitToWidth':
        zoomScale = this.fitToWidth(docNum, pageNum);
        break;

      // page에 맞춤
      case 'fitToPage':
        zoomScale = this.fitToPage(docNum, pageNum);
        break;
    }

    return zoomScale;
  }

  calcNewZoomScale(currentScale, sgn) {
    let step;

    // fit to page등 %로 1의 자리수가 남아있는 경우 floow 처리
    const prevScale = Math.floor(currentScale * 10) / 10;
    if (sgn > 0) {
      if (prevScale < 1.1) step = 0.1;
      else if (prevScale < 2) step = 0.2;
      else step = 0.3;
    }
    else {
      if (prevScale <= 1.1) step = 0.1;
      else if (prevScale <= 2.1) step = 0.2;
      else step = 0.3;
    }

    let newScale = Math.round((prevScale + step * sgn) * 10) / 10;

    newScale = Math.min(newScale, this.maxZoomScale);
    newScale = Math.max(newScale, this.minZoomScale);

    console.log('new Scale:', newScale);

    return newScale;
  }


    // page 폭에 맞추기
    fitToWidth(currentDoc, currentPage) {
        const containerSize = {
            // width: CANVAS_CONFIG.maxContainerWidth - CANVAS_CONFIG.sidebarContainerWidth //원본
            width: CANVAS_CONFIG.maxContainerWidth - CANVAS_CONFIG.sidebarContainerWidth - 300, // fitToWidth 관련 (100px) / right side bar 때문에 300 줬음
            height: CANVAS_CONFIG.maxContainerHeight,
        };
        const pdfPage: any = this.pdfStorageService.getPdfPage(currentDoc, currentPage);
        const docSize = pdfPage.getViewport({ scale: 1 * CANVAS_CONFIG.CSS_UNIT });

    const zoomScale = containerSize.width / docSize.width;

    return zoomScale;
  }

  // page에 맞추기
  fitToPage(currentDoc, currentPage) {
    const containerSize = {
      width: CANVAS_CONFIG.maxContainerWidth,
      height: CANVAS_CONFIG.maxContainerHeight
    };

    const pdfPage: any = this.pdfStorageService.getPdfPage(currentDoc, currentPage);
    const docSize = pdfPage.getViewport({scale: 1 * CANVAS_CONFIG.CSS_UNIT}); // 100%에 해당하는 document의 size (Css 기준)

    const ratio = {
      w: containerSize.width / docSize.width,
      h: containerSize.height / docSize.height
    };

    const zoomScale = Math.min(ratio.h, ratio.w);

    return zoomScale;
  }
}
