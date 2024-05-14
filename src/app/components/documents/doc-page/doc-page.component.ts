import { CommonModule } from '@angular/common';
import { Component, effect } from '@angular/core';
import { DocumentService } from '../../../services/document/document.service';
import { RenderingService } from '../../../services/rendering/rendering.service';
import { MatIconModule } from '@angular/material/icon';

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
  constructor(private docService: DocumentService, private renderingService: RenderingService) {
    effect(() => {
      this.doc = this.docService._doc();
      setTimeout(() => {
        this.renderThumbnails()
      })
    })
  }


  async renderThumbnails() {
    this.thumbArray = [];
    for (let i = 0; i < this.doc.length; i++) {
      const thumbSize = this.renderingService.getThumbnailSize(this.docService.lastDocNum() + 1, i + 1);
      this.thumbArray.push(thumbSize);
    };

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

  }
}
