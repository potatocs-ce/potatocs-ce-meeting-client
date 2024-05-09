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
}
