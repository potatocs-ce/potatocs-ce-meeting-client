import { Injectable, effect, signal } from '@angular/core';
import { DocApiService } from '../../api/doc/doc-api.service';
import { FileService } from '../file/file.service';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {

  constructor(private DocApi: DocApiService, private fileService: FileService) { }

  _docList: any = signal<any>([]);


  getDocLength() {
    return this._docList().length;
  }

  getPdfPage(pdfNum: number, pageNum: number) {
    return this._docList()[pdfNum - 1]?.pdfPages[pageNum - 1];
  }

  getViewportSize(docNum: number, pageNum: number) {
    return this._docList()[docNum - 1].pdfPages[pageNum - 1].getViewport({ scale: 1 })
  }

  memoryRelease() {
    for (const item of this._docList()) {
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

  /**
   * 각 pdf document api 요청
   * @param result 
   */
  async generatePdfData(result: any) {
    const pdfArrayVar = [...this._docList()];

    for (let i = 0; i < result.length; i++) {
      const updatedTime = result[i].updatedAt;

      if (pdfArrayVar[i]?.updatedAt !== updatedTime) {
        try {
          // PDF File 정보 요청
          const res: any = await this.DocApi.getDoc(result[i]._id).toPromise();

          // Array buffer로 변환
          const file = await this.fileService.readFile(res);

          const pdf_file = await this.fileService.pdfConvert(file);
          result[i].fileBuffer = file;
          result[i].pdfDoc = pdf_file.pdfDoc;
          result[i].pdfPages = pdf_file.pdfPages;
          pdfArrayVar[i] = result[i];
        } catch (err) {
          console.error(err);
          return err;
        }
      }
    }

    this._docList.set(pdfArrayVar);
    return;
  }
}
