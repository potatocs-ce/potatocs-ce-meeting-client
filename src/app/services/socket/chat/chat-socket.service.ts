import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { MeetingService } from '../../meeting/meeting.service';
import { MeetingServiceAPI } from '../../../api/meeting/meetingAPI.service';
import { DrawingService } from '../../drawing/drawing.service';

@Injectable({
  providedIn: 'root'
})
export class ChatSocketService {

  constructor(private socket: Socket,
    private meetingService: MeetingService,
    private meetingServiceApi: MeetingServiceAPI,
    private drawingService: DrawingService) {
    this.socket.on('receiveChatData', (chatData: any) => {

      for (let i = 0; i < chatData.images.length; i++) {
        this.meetingServiceApi.getChatImage(chatData.images[i].key).subscribe((res2: any) => {
          chatData.images[i].blob = URL.createObjectURL(res2)


          // canvas 생성
          const canvas: any = document.createElement('canvas');
          // height는 50px 고정
          canvas.width = 160;
          // width 는 height랑 비율 맞춰서 지정
          canvas.height = chatData.images[i].height * (160 / chatData.images[i].width);

          // getContext 
          const context: any = canvas.getContext('2d');
          // 50px 로 줄어들면 얼마나 줄어든건지 계산
          const zoomScale = 160 / chatData.images[i].width;

          // canvas 스케일 변경 젹용
          context.setTransform(zoomScale, 0, 0, zoomScale, 0, 0)
          // 그림 그리기
          // console.log(chatData.images[j])
          chatData.images[i].drawingDatas?.forEach((data: any) => {
            this.drawingService.end(context, data.points, data.tool)
          })

          canvas.style.position = 'absolute';
          canvas.style.top = '0';
          canvas.style.left = '0';
          chatData.images[i].canvas = canvas
        })
      }
      meetingService.meeting_chat_info.set([...this.meetingService.meeting_chat_info(), chatData])
    })
  }

  sendChat(data: any) {
    data.room_id = this.meetingService.meeting_room_id();
    this.socket.emit('sendChat', data, async (chatData: any) => {
      for (let i = 0; i < chatData.images.length; i++) {
        this.meetingServiceApi.getChatImage(chatData.images[i].key).subscribe((res2: any) => {
          chatData.images[i].blob = URL.createObjectURL(res2)


          // canvas 생성
          const canvas: any = document.createElement('canvas');
          // height는 50px 고정
          canvas.width = 160;
          // width 는 height랑 비율 맞춰서 지정
          canvas.height = chatData.images[i].height * (160 / chatData.images[i].width);

          // getContext 
          const context: any = canvas.getContext('2d');
          // 50px 로 줄어들면 얼마나 줄어든건지 계산
          const zoomScale = 160 / chatData.images[i].width;

          // canvas 스케일 변경 젹용
          context.setTransform(zoomScale, 0, 0, zoomScale, 0, 0)
          // 그림 그리기
          // console.log(chatData.images[j])
          chatData.images[i].drawingDatas?.forEach((data: any) => {
            this.drawingService.end(context, data.points, data.tool)
          })

          canvas.style.position = 'absolute';
          canvas.style.top = '0';
          canvas.style.left = '0';
          chatData.images[i].canvas = canvas
        })
      }




      this.meetingService.meeting_chat_info.set([...this.meetingService.meeting_chat_info(), chatData])
    });
  }

}
