import { Injectable, signal } from '@angular/core';
import { CANVAS_CONFIG } from '../../../config/config';
import { DocumentService } from '../document/document.service';

@Injectable({
  providedIn: 'root'
})
export class ZoomService {

  zoomScale: any = signal<number>(1) // 확대 정도

  maxZoomScale = CANVAS_CONFIG.maxZoomScale;
  minZoomScale = CANVAS_CONFIG.minZoomScale;


  constructor(private docService: DocumentService) { }


  // zoomscale 결정(zoomin, zoomout, fit to page .... etc)
  calcZoomScale(zoomInfo: string, docNum: number, pageNum: number, prevZoomScale = 1) {

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

  calcNewZoomScale(currentScale: number, sgn: number) {
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
  fitToWidth(currentDoc: any, currentPage: number) {
    const containerSize = {
      // width: CANVAS_CONFIG.maxContainerWidth - CANVAS_CONFIG.sidebarContainerWidth //원본
      width: CANVAS_CONFIG.maxContainerWidth, // fitToWidth 관련 (100px) / right side bar 때문에 300 줬음
      height: CANVAS_CONFIG.maxContainerHeight,
    };
    const pdfPage: any = this.docService.getPdfPage(currentDoc + 1, currentPage);
    const docSize = pdfPage.getViewport({ scale: 1 * CANVAS_CONFIG.CSS_UNIT });

    const zoomScale = containerSize.width / docSize.width;

    return zoomScale;
  }

  // page에 맞추기
  fitToPage(currentDoc: any, currentPage: number) {
    const containerSize = {
      width: CANVAS_CONFIG.maxContainerWidth,
      height: CANVAS_CONFIG.maxContainerHeight
    };

    const pdfPage: any = this.docService.getPdfPage(currentDoc + 1, currentPage);
    const docSize = pdfPage.getViewport({ scale: 1 * CANVAS_CONFIG.CSS_UNIT }); // 100%에 해당하는 document의 size (Css 기준)

    const ratio = {
      w: containerSize.width / docSize.width,
      h: containerSize.height / docSize.height
    };

    const zoomScale = Math.min(ratio.h, ratio.w);

    return zoomScale;
  }
}
