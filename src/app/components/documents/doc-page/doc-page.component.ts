import { CommonModule } from '@angular/common';
import { Component, ElementRef, QueryList, ViewChildren, effect } from '@angular/core';
import { DocumentService } from '../../../services/document/document.service';
import { RenderingService } from '../../../services/rendering/rendering.service';
import { MatIconModule } from '@angular/material/icon';
import { RoleSocketService } from '../../../services/socket/role/role-socket.service';

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
    private roleSocketService: RoleSocketService) {
    effect(() => {
      this.doc = this.docService._doc();
      this.currentPageNum = this.docService.pageBuffer()[this.docService.lastDocNum()] - 1
      setTimeout(() => {
        this.renderThumbnails()
      })
    })



    effect(() => {
      const data = this.docService.thumbData();

      if (!this.docService._doc().length) return

      this.renderThumbnailBox(data);
    })
  }



  renderThumbnailBox(data: any) {
    if (!this.thumbArray.length) return
    const scrollRatio = this.thumbArray[this.currentPageNum].width / data.coverWidth;
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

    this.docService.updateCurrentPageNum(page); // page num 업데이트
    this.currentPageNum = page;


    this.roleSocketService.presentStatus();
  }
}
