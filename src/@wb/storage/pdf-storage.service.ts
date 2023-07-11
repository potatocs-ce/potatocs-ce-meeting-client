import { Injectable } from '@angular/core';
import { PDF_VERSION } from '../config/config';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

pdfjsLib.GlobalWorkerOptions.workerSrc = './assets/lib/pdf/pdf.worker.js';

@Injectable({
  providedIn: 'root',
})
export class PdfStorageService {
  private _pdfVarArray: Array<any> = [];

  constructor() {}

  get pdfVarArray(): any {
    return [...this._pdfVarArray];
  }

  setPdfVarArray(pdfVarArray) {
    this._pdfVarArray = pdfVarArray;
  }

  getPdfLength() {
    return this._pdfVarArray.length;
  }

  /**
   * pdf Page return
   * @param {number} pageNum 페이지 번호
   * @return 해당 page의 pdf document
   */
  getPdfPage(pdfNum, pageNum) {
    return this._pdfVarArray[pdfNum - 1]?.pdfPages[pageNum - 1];
  }

  /**
   * 해당 page의 scale 1에 해당하는 viewport size.
   * @param {number} pageNum 페이지 번호
   */
  getViewportSize(docNum, pageNum) {
    // console.log(`> get ViewPort size: docNum : ${docNum}, pageNum : ${pageNum}`);
    return this._pdfVarArray[docNum - 1].pdfPages[pageNum - 1].getViewport({
      scale: 1,
    });
  }

  /**
   * Memory Release
   * - pdf.js Destory for memory release
   * {@link https://github.com/mozilla/pdf.js/issues/9662 }
   * {@link https://stackoverflow.com/questions/40890212/viewer-js-pdf-js-memory-usage-increases-every-time-a-pdf-is-rendered?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa}
   */
  memoryRelease() {
    // console.log('PDF Memeory Release');

    for (const item of this._pdfVarArray) {
      if (item.pdfDestroy) {
        item.pdfDestroy.cleanup();
        item.pdfDestroy.destroy();
      }

      for (const pdfPage of item.pdfPages) {
        pdfPage.cleanup();
      }

      item.pdfDestroy = '';
      item.pdfPages = [];
    }
  }
}
