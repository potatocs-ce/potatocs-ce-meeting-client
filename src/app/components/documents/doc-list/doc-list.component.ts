import { Component, ElementRef, QueryList, ViewChildren, effect } from '@angular/core';
import { DocumentService } from '../../../services/document/document.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RenderingService } from '../../../services/rendering/rendering.service';

@Component({
  selector: 'app-doc-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './doc-list.component.html',
  styleUrl: './doc-list.component.scss'
})
export class DocListComponent {
  docList: any;
  @ViewChildren('thumb') thumRef: QueryList<ElementRef> | any;
  constructor(private docService: DocumentService, private renderingService: RenderingService) {
    effect(() => {
      this.docList = this.docService._docList()
      setTimeout(() => {
        this.renderFileList();
      }, 0)
    })
  }

  async renderFileList() {
    for (let i = 0; i < this.docList.length; i++) {
      await this.renderingService.renderThumbBackground(document.getElementById(`thumb${i + 1}`), i + 1, 1);
    };
  }
}
