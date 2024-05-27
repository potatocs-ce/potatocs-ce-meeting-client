import { Injectable, effect, signal } from '@angular/core';
import { DrawingService } from '../../drawing/drawing.service';
import { Socket } from 'ngx-socket-io';
import { AuthService } from '../../auth/auth.service';
import { DocumentService } from '../../document/document.service';
import { CANVAS_CONFIG } from '../../../../config/config';

@Injectable({
  providedIn: 'root'
})
export class VideoDrawingService {
  // 여기 비디오 위에서 그려진 그림들 전송하는 로직 작성


  stop: any = null;

  // 그림 데이터 큐
  dataArray: any = [];
  // 유저 데이터 큐
  lastUser: any = [];

  // 비디오 그림 전체 데이터
  drawVarArray: any = signal<Object>({})
  eraserWidth: number = CANVAS_CONFIG.eraserWidth;
  highlighterWidth: number = CANVAS_CONFIG.highlighterWidth;

  constructor(
    private drawingService: DrawingService,
    private socket: Socket,
    private authService: AuthService,

  ) {
    this.socket.on('draw:video', async (data: any) => {

      if (this.drawVarArray()[data.target_id]) {
        this.drawVarArray()[data.target_id].push({ drawingEvent: data.drawingEvent, userId: this.authService.getTokenInfo()._id });
      } else {
        this.drawVarArray()[data.target_id] = [{ drawingEvent: data.drawingEvent, userId: this.authService.getTokenInfo()._id }];
      }
      this.lastUser.push(data.target_id)
      this.drawVarArray.set({ ...this.drawVarArray() })
      this.dataArray.push(data.drawingEvent);
      if (this.dataArray.length == 1) {
        this.drawingQueue();
      }
    })

    this.socket.on('draw:video_clear', async (data: any) => {
      this.drawVarArray()[data.target_id] = [];
      this.drawVarArray.set({ ...this.drawVarArray() })
      const target_canvas: any = document.getElementById(data.target_id)!.querySelector('.data_canvas')
      const context: any = target_canvas.getContext('2d');
      // Canvas 크기에 맞는 새로운 사각형을 그려서 이전에 그려진 요소들을 지웁니다.
      // 현재의 transform 상태를 저장
      context.save();

      // transform을 초기화하여 원래 좌표계로 복귀
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, target_canvas.width, target_canvas.height);
      // 저장된 transform 상태를 복원
      context.restore();
    })




    effect(async () => {
      // 사용자별로 구분하는 것도 필요할듯

      // if (this.lastUser() != '') {
      //   const value = this.drawVarArray()[this.lastUser()][0]

      //   const [firstKey, firstValue]: any = Object.entries(this.drawVarArray())[0];

      //   this.dataArray.push(firstValue[firstValue.length - 1]);
      //   if (this.dataArray.length == 1) {
      //     this.drawingQueue();
      //   }

      // }
    })
  }

  // {socket_id: , drawingEvent}


  async stopQueue() {
    this.dataArray = [];
    clearInterval(this.stop);
    this.stop = null;
  }

  async drawingQueue() {
    if (!this.dataArray.length) return;
    // console.log(this.lastUser())
    // console.log(document.getElementById(this.lastUser()))


    const data_canvas: any = document.getElementById(this.lastUser[0])!.querySelector('.data_canvas')
    const data_context: any = data_canvas.getContext('2d');
    const target_canvas: any = document.getElementById(this.lastUser[0])!.querySelector('.target_canvas')
    const context: any = target_canvas.getContext('2d');



    const data = this.dataArray[0]

    // this.drawingService.end(data_context,firstValue[firstValue.length - 1].points, firstValue[firstValue.length - 1].tool)

    const pointsLength = data.points.length / 2;


    context.lineCap = "round";
    context.lineJoin = 'round';
    context.globalAlpha = 1;
    context.lineWidth = data.tool.width;




    if (data.tool.type === "pen" || data.tool.type === "eraser" || data.tool.type === "highlighter") {
      if (pointsLength < 3) {
        context.beginPath();
        context.arc(data.points[0], data.points[1], data.tool.width / 2, 0, Math.PI * 2, !0);
        context.fill();
        context.closePath();
        // 현재의 transform 상태를 저장
        context.save();

        // transform을 초기화하여 원래 좌표계로 복귀
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, target_canvas.width, target_canvas.height);
        // 저장된 transform 상태를 복원
        context.restore();
        this.drawingService.end(data_context, data.points, data.tool)
        this.dataArray.shift()
        this.lastUser.shift()
        this.drawingQueue()
        return;

      }

      let i = 2;

      this.stop = setInterval(() => {

        if (data.tool.type === "pen") {
          context.globalCompositeOperation = 'source-over';
          context.strokeStyle = data.tool.color;
          context.fillStyle = data.tool.color;
        }
        else if (data.tool.type === "eraser") {
          context.globalCompositeOperation = 'source-over';
          context.strokeStyle = "rgba(255, 255, 255, 1)";
          context.fillStyle = "rgba(255, 255, 255, 1)";
          context.lineWidth = data.tool.width + this.eraserWidth
        }
        else if (data.tool.type === "highlighter") {
          context.globalCompositeOperation = 'xor';
          context.globalAlpha = 0.5;
          context.lineCap = "round";
          context.fillStyle = data.tool.color;
          context.strokeStyle = data.tool.color;
          context.lineWidth = data.tool.width + this.highlighterWidth
        }
        context.beginPath();
        if (i === 2) {
          context.moveTo(data.points[0], data.points[1]);
        }
        else {
          context.lineCap = "round";
          const a = (data.points[2 * (i - 2)] + data.points[2 * (i - 1)]) / 2;
          const b = (data.points[2 * (i - 2) + 1] + data.points[2 * (i - 1) + 1]) / 2;
          context.moveTo(a, b);
        }
        const c = (data.points[2 * (i - 1)] + data.points[2 * i]) / 2;
        const d = (data.points[2 * (i - 1) + 1] + data.points[2 * i + 1]) / 2;
        context.quadraticCurveTo(data.points[2 * (i - 1)], data.points[2 * (i - 1) + 1], c, d);
        context.stroke();
        i += 1;

        if (i === pointsLength) {
          clearInterval(this.stop);
          this.stop = null;
          // 현재의 transform 상태를 저장
          context.save();

          // transform을 초기화하여 원래 좌표계로 복귀
          context.setTransform(1, 0, 0, 1, 0, 0);
          context.clearRect(0, 0, target_canvas.width, target_canvas.height);
          // 저장된 transform 상태를 복원
          context.restore();
          // 최종 target에 그리기
          this.drawingService.end(data_context, data.points, data.tool)

          this.dataArray.shift()
          this.lastUser.shift()
          this.drawingQueue()
        }

      }, data.timeDiff / pointsLength);
    } else if (data.tool.type == 'line') {
      data_context.fillStyle = data.tool.color;
      data_context.strokeStyle = data.tool.color;
      data_context.lineWidth = data.tool.width;
      const len = data.points.length / 2;
      data_context.beginPath();
      data_context.moveTo(data.points[0], data.points[1]);
      data_context.lineTo(data.points[2 * (len - 1)], data.points[2 * (len - 1) + 1]);
      data_context.closePath();
      data_context.stroke();

      this.dataArray.shift()
      this.lastUser.shift()
    } else if (data.tool.type == 'circle') {
      data_context.fillStyle = data.tool.color;
      data_context.strokeStyle = data.tool.color;
      data_context.lineWidth = data.tool.width;
      const len = data.points.length / 2;
      var radiusX = (data.points[2 * (len - 1)] - data.points[0]) * 0.5,   /// radius for x based on input
        radiusY = (data.points[2 * (len - 1) + 1] - data.points[1]) * 0.5,   /// radius for y based on input
        centerX = data.points[0] + radiusX,      /// calc center
        centerY = data.points[1] + radiusY,
        step = 0.01,                 /// resolution of ellipse
        a = step,                    /// counter
        pi2 = Math.PI * 2 - step;    /// end angle

      /// start a new path
      data_context.beginPath();

      /// set start point at angle 0
      data_context.moveTo(centerX + radiusX * Math.cos(0),
        centerY + radiusY * Math.sin(0));

      /// create the ellipse    
      for (; a < pi2; a += step) {
        data_context.lineTo(centerX + radiusX * Math.cos(a),
          centerY + radiusY * Math.sin(a));
      }

      /// close it and stroke it for demo
      data_context.closePath();
      data_context.stroke();
      this.dataArray.shift()
      this.lastUser.shift()
    } else if (data.tool.type == 'rectangle') {
      data_context.beginPath();
      data_context.fillStyle = data.tool.color;
      data_context.strokeStyle = data.tool.color;
      data_context.lineWidth = data.tool.width;
      const len = data.points.length / 2;
      data_context.strokeRect(data.points[0], data.points[1], (data.points[2 * (len - 1)] - data.points[0]), (data.points[2 * (len - 1) + 1] - data.points[1]));
      data_context.closePath();
      // fillRect는 색이 채워지고 strokeRect은 색이 채워지지 않는다.
      // context.fillRect(points[0], points[1], (points[2 * (len - 1)] - points[0]), (points[2 * (len - 1) + 1] - points[1]));
      this.dataArray.shift()
      this.lastUser.shift()
    }

  }
}
