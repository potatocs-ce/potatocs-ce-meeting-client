import { CommonModule } from '@angular/common';
import { Component, ElementRef, QueryList, ViewChildren, effect, untracked } from '@angular/core';
import { DocumentService } from '../../../services/document/document.service';
import { RenderingService } from '../../../services/rendering/rendering.service';
import { MatIconModule } from '@angular/material/icon';
import { RoleSocketService } from '../../../services/socket/role/role-socket.service';
import { PdfDrawingService } from '../../../services/socket/pdf_drawing/pdf-drawing.service';
import { MeetingService } from '../../../services/meeting/meeting.service';

@Component({
  selector: 'app-doc-page',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './doc-page.component.html',
  styleUrl: './doc-page.component.scss'
})
export class DocPageComponent {
  doc: Array<any> = [];
  thumbArray: Array<any> = [];
  currentPageNum: number = 0;


  thumbWindow: HTMLDivElement | any;
  thumbWindowSize = {
    width: '',
    height: ''
  }


  @ViewChildren('thumbWindow') thumbWindowRef: QueryList<ElementRef> | any;


  constructor(private docService: DocumentService,
    private renderingService: RenderingService,
    private roleSocketService: RoleSocketService,
    private pdfDrawingService: PdfDrawingService,
    private meetingService: MeetingService) {
    // 현재 문서 목록 업데이트 
    effect(() => {
      this.doc = this.docService._doc();
      // 

      setTimeout(() => {
        this.renderThumbnails()
      })
    })


    // 썸네일 업데이트 + 페이지 업데이트
    effect(() => {
      const data = this.docService.thumbData();
      this.currentPageNum = this.docService.pageBuffer()[this.docService.lastDocNum()] - 1
      if (!this.docService._doc().length) return

      this.renderThumbnailBox(data);
    })

    // 판서 정보 업데이트 
    effect(() => {
      this.docService.drawingData();
      if (this.thumbArray.length != 0) {
        console.log(this.thumbArray, this.currentPageNum, '뭐지')
        const drawingEventSet = this.docService.drawingData().find((data: any) => this.docService._docList()[this.docService.lastDocNum()]?._id == data._id)?.drawings;
        const drawingEvents = drawingEventSet?.filter((item: any) => item.page === this.currentPageNum + 1);
        const dataCanvas = document.getElementById(`thumb_data_canvas${this.currentPageNum + 1}`) as HTMLCanvasElement;

        this.renderingService.renderBoard(dataCanvas, this.thumbArray[this.currentPageNum].scale, drawingEvents);
      }
    })

    // 처음 들어왔을 때 
    effect(() => {
      this.meetingService.skipList();
      untracked(() => {

        for (let i = 0; i < this.doc.length; i++) {
          const drawingEventSet = this.docService.drawingData().find((data: any) => this.docService._docList()[this.docService.lastDocNum()]?._id == data._id)?.drawings
          const drawingEvents = drawingEventSet?.filter((item: any) => item.page === i + 1);
          const dataCanvas = document.getElementById(`thumb_data_canvas${i + 1}`) as HTMLCanvasElement;

          this.renderingService.renderBoard(dataCanvas, this.thumbArray[i].scale, drawingEvents);
        }

      })
    })
  }




  renderThumbnailBox(data: any) {
    if (this.thumbArray.length == 0) return

    const scrollRatio = this.thumbArray[this.currentPageNum]?.width / data.coverWidth;
    this.thumbWindowSize = {
      width: this.thumbArray[this.currentPageNum].width * data.ratio.w + 'px',
      height: this.thumbArray[this.currentPageNum].height * data.ratio.h + 'px'
    };
    setTimeout(() => {
      this.thumbWindow = this.thumbWindowRef.last.nativeElement;
      this.thumbWindow.style.left = data.left * scrollRatio + 'px';
      this.thumbWindow.style.top = data.top * scrollRatio + 'px';
    })
  }


  async renderThumbnails() {
    this.thumbArray = [];
    for (let i = 0; i < this.doc.length; i++) {
      const thumbSize = this.renderingService.getThumbnailSize(this.docService.lastDocNum() + 1, i + 1);

      this.thumbArray.push(thumbSize);
    };

    // 동기성 보장
    setTimeout(() => {
      this.renderThumbnailBox(this.docService.thumbData())
    })

    for (let i = 0; i < this.doc.length; i++) {
      const drawingEventSet = this.docService.drawingData().find((data: any) => this.docService._docList()[this.docService.lastDocNum()]?._id == data._id)?.drawings

      // 없으면 undefined.
      const drawingEvents = drawingEventSet?.filter((item: any) => item.page === i + 1);
      const dataCanvas = document.getElementById(`thumb_data_canvas${i + 1}`) as HTMLCanvasElement;
      const drawingCanvas = document.getElementById(`thumb_drawing_canvas${i + 1}`) as HTMLCanvasElement;
      dataCanvas.width = this.thumbArray[i].width;
      dataCanvas.height = this.thumbArray[i].height;

      drawingCanvas.width = this.thumbArray[i].width;
      drawingCanvas.height = this.thumbArray[i].height;


      const ctx: any = dataCanvas.getContext("2d");
      const drawing_ctx: any = drawingCanvas.getContext('2d');
      ctx.setTransform(this.thumbArray[i].scale, 0, 0, this.thumbArray[i].scale, 0, 0);
      drawing_ctx.setTransform(this.thumbArray[i].scale, 0, 0, this.thumbArray[i].scale, 0, 0);

      this.renderingService.renderBoard(dataCanvas, this.thumbArray[i].scale, drawingEvents);

      await this.renderingService.renderThumbBackground(document.getElementById(`thumb_${i + 1}`), this.docService.lastDocNum() + 1, i + 1);
    }
  }

  // 폴더 리스트로 돌아가기
  backToFileList() {
    this.docService._doc.set([]);
  }

  // 페이지 선택
  clickThumb(page: number) {
    if (page == this.currentPageNum) return; // 동일 page click은 무시

    this.pdfDrawingService.stopQueue(); // <-- 그려지고 있는게 있으면 중단

    this.docService.updateCurrentPageNum(page); // page num 업데이트
    this.currentPageNum = page;

    this.roleSocketService.presentStatus();
  }
}
