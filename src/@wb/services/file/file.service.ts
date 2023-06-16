import { Injectable } from '@angular/core';
import { PdfStorageService } from '../../storage/pdf-storage.service';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../apiService/api.service';

import * as pdfjsLib from 'pdfjs-dist/build/pdf';
pdfjsLib.GlobalWorkerOptions.workerSrc = './assets/lib/pdf/pdf.worker.js';


@Injectable({
  providedIn: 'root'
})
export class FileService {

  constructor(
    private pdfStorageService: PdfStorageService,
    private apiService: ApiService,
    private http: HttpClient,
  ) { }


  /**
   *
   * File read API
    - urlFlag: boolean:
    => true: 저장된 file 읽는 경우 => text로 read...
    => false: PDF 문서 불러오는 경우
   *
   */
  readFile(file) {
    const fileReader = new FileReader();
    return new Promise(function (resolve, reject) {
      fileReader.onload = function (e) {
        resolve((<FileReader>e.target).result);
      };
      fileReader.readAsArrayBuffer(file);
    });
  }

  /**
   *
   * Pdf convert API
   *  https://mozilla.github.io/pdf.js/examples/
   * - cmap
   *   https://github.com/wojtekmaj/react-pdf/blob/master/README.md
   *  https://github.com/mozilla/pdf.js/issues/9380
   *
   * @param file
   * @returns
   */
  async pdfConvert(file) {
    const CMAP_URL = '/assets/lib/pdf/cmaps/'; // --> 나중에 서버로 이동할지 check.
    const CMAP_PACKED = true;
    const pdfPages = [];

    try {
      // new version
      const pdfDoc = await pdfjsLib.getDocument({
        data: file,
        cMapUrl: CMAP_URL,
        cMapPacked: CMAP_PACKED
      }).promise;

      for (let i = 0; i < pdfDoc.numPages; i++) {
        pdfPages[i] = await pdfDoc.getPage(i + 1);
      }
      // destroy를 위해 pdfDoc도 반환.
      return {
        pdfPages: pdfPages,
        pdfDoc: pdfDoc // for destroy
      };
    } catch (err) {
      console.log(err);
      alert('오류가 발생하였습니다 : ' + err);
      return {
        success: false
      }
    }
  };


}
