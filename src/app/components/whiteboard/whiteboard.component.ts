import { Component, ElementRef, ViewChild, effect } from '@angular/core';
import { DocumentService } from '../../services/document/document.service';
import * as pdfjsLib from 'pdfjs-dist';
import { RenderingService } from '../../services/rendering/rendering.service';


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


  @ViewChild('bg', { static: true }) public bgCanvasRef: ElementRef | any;
  @ViewChild('tmp', { static: true }) public tmpCanvasRef: ElementRef | any;

  bgCanvas: HTMLCanvasElement | any;
  tmpCanvas: HTMLCanvasElement | any;

  constructor(
    private docService: DocumentService,
    private renderingService: RenderingService

  ) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = './assets/lib/pdf/pdf.worker.js';
    effect(() => {
      this.docInfo = this.docService._docList()[this.docService.lastDocNum()]
      if (this.docInfo) {
        this.pageInfo = this.docService._doc()[this.docInfo.lastPage];
      }

      console.log(this.docInfo, this.pageInfo)
    })
  }

  async pageRender(currentDocNum: number, currentPage: number, zoomScale: number) {
    // await this.renderingService.renderBackground
  }


}
