import { Injectable } from '@angular/core';
import { DocumentService } from '../document/document.service';

@Injectable({
  providedIn: 'root'
})
export class RenderingService {

  constructor(private documentService: DocumentService) { }

  async renderThumbBackground(imgElement: any, pdfNum: any, pageNum: any) {
    // console.log('> renderThumbnail Background');
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
      size.width = 140;
      size.height = size.width * viewport.height / viewport.width;
    }
    // portrait 문서 : 세로를 150px(thumbnailMaxSize)로 설정
    else {
      size.height = 140;
      size.width = size.height * viewport.width / viewport.height;
    }
    size.scale = size.width / (viewport.width * (96 / 72));

    return size;
  }
}
