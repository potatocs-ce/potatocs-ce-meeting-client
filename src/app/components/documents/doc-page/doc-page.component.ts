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



  backToFileList() {
    this.docService._doc.set([]);
  }
}
