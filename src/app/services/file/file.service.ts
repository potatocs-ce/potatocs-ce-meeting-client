import { Injectable } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = './assets/lib/pdf/pdf.worker.js';
@Injectable({
  providedIn: 'root'
})
export class FileService {

  constructor() { }


  readFile(file: any) {
    const fileReader = new FileReader();

    return new Promise(function (resolve, reject) {
      fileReader.onload = function (e) {
        resolve((<FileReader>e.target).result);
      };
      fileReader.readAsArrayBuffer(file);
    })
  }

  async pdfConvert(file: any) {
    const CMAP_URL = '/assets/lib/pdf/cmaps/';
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
  }
}
