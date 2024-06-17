import { Injectable, effect } from '@angular/core';
import { last, reject } from 'lodash';
import { Socket } from 'ngx-socket-io';
import { ToggleService } from '../../toggle/toggle.service';
import { DocumentService } from '../../document/document.service';
import { MeetingService } from '../../meeting/meeting.service';
import { AuthService } from '../../auth/auth.service';
import { VideoService } from '../../video/video.service';

@Injectable({
  providedIn: 'root'
})
export class RoleSocketService {

  constructor(private socket: Socket,
    private toggleService: ToggleService,
    private docService: DocumentService,
    private meetingService: MeetingService,
    private authService: AuthService,
    private videoService: VideoService) {

    this.socket.on('changeStatus', ({ toggle_video_whiteboard, lastDocNum, pageBuffer }: any) => {
      if (this.toggleService.toggle_video_whiteboard() != toggle_video_whiteboard) {
        this.toggleService.toggle_video_whiteboard.set(toggle_video_whiteboard);
        // 문서 모드이면
        if (toggle_video_whiteboard == 'document') {
          const stream = this.meetingService.present_user_info();

          this.meetingService.present_user_info.set(undefined)
          this.meetingService.users_info.set([stream, ...this.meetingService.users_info()])
        } else {
          // 아니면
          let temp_audience = this.meetingService.users_info()
          const stream = temp_audience.shift();

          this.meetingService.present_user_info.set(stream)
          this.meetingService.users_info.set([...temp_audience])
        }
      }


      if (this.docService.lastDocNum() != lastDocNum) {
        this.docService.changeToThumbnailView(lastDocNum)
      }


      this.docService.pageBuffer.set(pageBuffer);
    })
  }



  // role 업데이트 하기
  updateRole(room_id: string, role: string, member_id: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const data = {
        room_id,
        role,
        member_id
      }
      this.socket.emit('updateRole', data, (res: any) => {
        if (res == 'success') {
          resolve('success');
        } else {
          reject(new Error('Failed to update role'))
        }
      })
    })
  }

  presentStatus() {
    // mode, doc, page가 변경되었고, 로그인한 유저의 role이 presenter이면 emit
    const nowUser = this.meetingService.meeting_info().currentMembers.find((member: any) => member.member_id._id == this.authService.getTokenInfo()._id)
    // 1. mode 가 변경되거나
    const toggle_video_whiteboard = this.toggleService.toggle_video_whiteboard()

    // 2. doc 가 변경되거나
    const lastDocNum = this.docService.lastDocNum()

    // 3. page가 변경되면
    const pageBuffer = this.docService.pageBuffer()
    if (nowUser.role == 'Presenter') {


      this.socket.emit('changeStatus', { room_id: this.meetingService.meeting_info()._id, toggle_video_whiteboard, lastDocNum, pageBuffer })
    }
  }


}
