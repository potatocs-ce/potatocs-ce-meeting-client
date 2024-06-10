import { Injectable, effect, signal } from '@angular/core';
import { DocApiService } from '../../api/doc/doc-api.service';
import { FileService } from '../file/file.service';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {

  constructor(private DocApi: DocApiService, private fileService: FileService) { }

  _docList: any = signal<any>([]); // 문서 리스트 저장용
  _doc: any = signal<any>([]); // 문서 정보(페이지) 저장용
  lastDocNum: any = signal<number>(-1); // 최근 문서 번호
  pageBuffer: any = signal<Array<any>>([]); // 페이지 임시 저장용

  drawingData: any = signal<Array<any>>([]); // 문서별 판서 정보 저장용


  docDataLoading: any = signal<boolean>(false); // true면 로딩중.. false면 로딩 아님 

  // 썸네일에 현재 보고있는 네모 박스 보여주는 변수
  /**
   * ratio: 가로, 세로 비율
   * coverWidth: 현재 커버 캔버스의 가로 길이
   * left: x 좌표
   * top: y 좌표
   */
  thumbData: any = signal<any>({ ratio: { width: 0, height: 0 }, coverWidth: 0, left: 0, top: 0 })

  // 문서 길이
  getDocLength() {
    return this._docList().length;
  }

  // pdf page 가져오기
  getPdfPage(pdfNum: number, pageNum: number) {
    return this._docList()[pdfNum - 1]?.pdfPages[pageNum - 1];
  }

  // viewport 반환
  getViewportSize(docNum: number, pageNum: number) {
    return this._docList()[docNum - 1].pdfPages[pageNum - 1].getViewport({ scale: 1 })
  }


  getDrawingEvents() {
    const drawingEventSet = this.drawingData().find((data: any) => this._docList()[this.lastDocNum()]?._id == data._id)?.drawings

    // 없으면 undefined.
    return drawingEventSet?.filter((item: any) => item.page === this.pageBuffer()[this.lastDocNum()]);
  }


  // 메모리 비우기
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

  // 판서 정보 받아오기
  generateDrawingData(result: any) {
    this.drawingData.set(result);
  }


  /**
   * 각 pdf document api 요청
   * @param result 
   */
  async generatePdfData(result: any) {

    const bufferArray = [];
    const pageBuffer = [];

    this.docDataLoading.set(true);

    for (let i = 0; i < result.length; i++) {
      const updatedTime = result[i].updatedAt;

      if (this._docList()[i]?.updatedAt !== updatedTime) {
        try {
          // PDF File 정보 요청
          const res: any = await this.DocApi.getDoc(result[i]._id).toPromise();

          // Array buffer로 변환
          const file = await this.fileService.readFile(res);
          // pdf data 변환
          const pdf_file = await this.fileService.pdfConvert(file);

          result[i].fileBuffer = file;
          result[i].pdfDoc = pdf_file.pdfDoc;
          result[i].pdfPages = pdf_file.pdfPages;
          pageBuffer[i] = 1;
          bufferArray[i] = result[i];
        } catch (err) {
          console.error(err);
          return err;
        }
      } else {
        bufferArray[i] = this._docList()[i]
      }
    }
    this.docDataLoading.set(false);
    this.pageBuffer.set(pageBuffer);
    this._docList.set(bufferArray);

    return;
  }

  // 썸네일 클릭해서 데이터 바뀌면
  changeToThumbnailView(docNum: number) {
    // _doc pdfPages로 데이터 변경
    this._doc.set(this._docList()[docNum].pdfPages);
    // 마지막 docNum은 클릭한 docNum으로 변경
    this.lastDocNum.set(docNum);
  }


  // 현재 문서의 페이지 업데이트
  updateCurrentPageNum(pageNum: number) {

    this.pageBuffer.update((page: any) => {
      page[this.lastDocNum()] = pageNum + 1;
      return [...page];
    })
  }


}
