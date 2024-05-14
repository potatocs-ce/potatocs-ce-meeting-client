import { Component, effect } from '@angular/core';
import { DocumentService } from '../../services/document/document.service';

@Component({
  selector: 'app-whiteboard',
  standalone: true,
  imports: [],
  templateUrl: './whiteboard.component.html',
  styleUrl: './whiteboard.component.scss'
})
export class WhiteboardComponent {
  docInfo: any = {};
  pageInfo: any = {};
  constructor(private docService: DocumentService) {
    effect(() => {
      this.docInfo = this.docService._docList()[this.docService.lastDocNum()]
      if (this.docInfo) {
        this.pageInfo = this.docService._doc()[this.docInfo.lastPage];
      }

      console.log(this.docInfo, this.pageInfo)
    })
  }
}
