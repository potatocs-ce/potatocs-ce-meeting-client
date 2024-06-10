import { Component, ElementRef, QueryList, ViewChildren, effect } from '@angular/core';
import { DocumentService } from '../../../services/document/document.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RenderingService } from '../../../services/rendering/rendering.service';
import { DocApiService } from '../../../api/doc/doc-api.service';
import { MeetingService } from '../../../services/meeting/meeting.service';
import { DocSocketService } from '../../../services/socket/doc/doc-socket.service';
import { DialogService } from '../../../services/dialog/dialog.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RoleSocketService } from '../../../services/socket/role/role-socket.service';
import { PdfDrawingService } from '../../../services/socket/pdf_drawing/pdf-drawing.service';

@Component({
  selector: 'app-doc-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './doc-list.component.html',
  styleUrl: './doc-list.component.scss'
})
export class DocListComponent {
  docList: any;
  @ViewChildren('thumb') thumRef: QueryList<ElementRef> | any;
  constructor(
    public docService: DocumentService,
    private renderingService: RenderingService,
    private docApiService: DocApiService,
    private meetingService: MeetingService,
    private docSocketService: DocSocketService,
    private dialogService: DialogService,
    private roleSocketService: RoleSocketService,
    private pdfDrawingService: PdfDrawingService) {
    effect(() => {
      this.docService._docList()
      setTimeout(() => {
        this.renderFileList();
      }, 0)
    })
  }

  async renderFileList() {

    for (let i = 0; i < this.docService._docList().length; i++) {
      await this.renderingService.renderThumbBackground(document.getElementById(`thumb${i + 1}`), i + 1, 1);
    };
  }



  // pdf 추가 기능
  handleUploadFileChanged(event: any) {

    const files: File[] = event.target.files;

    if (event.target.files.length === 0) {
      console.log('file 안등어옴');
      return;
    }


    if (files[0].size > 12000000) {
      this.dialogService.openDialogNegative(`This file is too large. Maximum file size is 12MB.`);
      console.log('너무 큽니다')
      return;
    }


    // 파일 유효성 검사
    const ext = (files[0].name).substring((files[0].name).lastIndexOf('.') + 1);
    if (ext.toLowerCase() != 'pdf') {
      this.dialogService.openDialogNegative(`Please, upload the '.pdf' file.`);
      console.log('pdf file을 업로드 해주세요')
    } else {
      this.docApiService.uploadFile(this.meetingService.meeting_room_id(), files).subscribe((res: any) => {
        // 업로드 성공시
        if (res.message == 'document uploaded') {
          this.docSocketService.updatedDoc(this.meetingService.meeting_room_id())
        }
      })
      // @OUTPUT -> white-board component로 전달
      // 
      //  this.newLocalDocumentFile.emit(event.target.files[0]);


      ///////////////////////////////////////////////////////////////////
      /*---------------------------------------
      pdf 업로드 시 spinner 
      -----------------------------------------*/
      //  const dialogRef = this.dialog.open(SpinnerDialogComponent, {
      //      // width: '300px',

      //      data: {
      //          content: 'Upload'
      //      }
      //  });
      //  // 
      //  this.eventBusService.emit(new EventData('spinner', dialogRef))
      ///////////////////////////////////////////////////////////////////
    }
  }

  // pdf 삭제
  deletePdf(_id: string) {
    this.dialogService.openDialogConfirm('Are you sure you want to delete it?').subscribe((result: any) => {
      if (result) {

        console.log(_id)
        console.log('>> click PDF : delete');
        this.docApiService.deleteMeetingPdfFile(_id).subscribe(async (data: any) => {

          // document delete 확인 후 socket room안의 모든 User에게 전송 (나 포함)
          // await this.socket.emit('check:documents', data.meetingId);
          this.docSocketService.updatedDoc(this.meetingService.meeting_room_id())
        })


        ///////////////////////////////////////////////////////////////////
        /*---------------------------------------
            pdf 삭제 시 spinner 
        -----------------------------------------*/
        // const dialogRef = this.dialog.open(SpinnerDialogComponent, {
        //   // width: '300px',

        //   data: {
        //     content: 'Delete'
        //   }
        // });


        this.renderFileList().then(async (value) => {
          // await dialogRef.close();
        });
      }
    });
  }

  // 디테일 페이지로 이동 
  clickPDF(docId: any) {
    console.log('>> click PDF : change to Thumbnail Mode');

    this.pdfDrawingService.stopQueue(); // <-- 그려지고 있는게 있으면 중단

    this.docService.changeToThumbnailView(docId)

    this.roleSocketService.presentStatus();
  }
}

