import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { DocApiService } from '../../../api/doc/doc-api.service';
import { MeetingService } from '../../meeting/meeting.service';
import { DocumentService } from '../../document/document.service';

@Injectable({
  providedIn: 'root'
})
export class DocSocketService {

  constructor(private socket: Socket, private docSerciceApi: DocApiService, private meetingService: MeetingService, private docService: DocumentService) {
    this.socket.on('check:documents', () => {
      console.log('<--- [SOCKET] check:document');
      this.docSerciceApi.getDocList(this.meetingService.meeting_room_id()).subscribe((res: any) => {
        this.docService.generatePdfData(res);
        console.log(this.docService.pageBuffer())
      })
    });
  }

  // 문서가 업데이트 됐다고 전파
  updatedDoc(meetingId: string) {
    // console.log('와우')
    this.socket.emit('check:documents', meetingId);

    this.docSerciceApi.getDocList(this.meetingService.meeting_room_id()).subscribe((res: any) => {
      this.docService.generatePdfData(res);
      console.log(this.docService.pageBuffer())
    })
  }
}
