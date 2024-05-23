import { Injectable, signal } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { DocumentService } from '../../document/document.service';
import { DrawingService } from '../../drawing/drawing.service';

@Injectable({
  providedIn: 'root'
})
export class PdfDrawingService {
  stop: any = null;

  dataArray: any = [];





  constructor(
    private socket: Socket,
    private docService: DocumentService,
    private drawingService: DrawingService) {
    this.socket.on('draw:document', async (data: any) => {
      const drawingData = this.docService.drawingData();
      const drawingEventSet = drawingData.find((data2: any) => data2._id == data.doc_id)?.drawings;
      // 있으면 넣어놓고 없으면 안넣고




      if (drawingEventSet) {

        drawingEventSet.push({ drawingEvent: data.drawingEvent, userId: data.user_id, page: data.pageNum })
        this.docService.drawingData.set([...drawingData])
      } else {
        this.docService.drawingData.update((data: any) => {
          data.push({ _id: data.doc_id, drawings: [{ drawingEvent: data.drawingEvent, userId: data.user_id, page: data.pageNum }] })
          return [...data]
        })
      }


      this.dataArray.push({ ...data.drawingEvent, page: data.pageNum, doc_id: data.doc_id });
      if (this.dataArray.length == 1) {
        this.drawingQueue();
      }
    })

  }

  clearDrawing(meetingId: string) {
    this.socket.emit('draw:doc_clear', { meetingId })
  }

  async stopQueue() {
    this.dataArray = [];
    clearInterval(this.stop);
    this.stop = null;
  }

  async drawingQueue() {
    if (!this.dataArray.length) return;
    // console.log(this.lastUser())
    // console.log(document.getElementById(this.lastUser()))
    const data_canvas: any = document.getElementById('canvasUser')
    const data_context: any = data_canvas.getContext('2d');
    const target_canvas: any = document.getElementById('coverRx')
    const context: any = target_canvas.getContext('2d');



    const data: any = this.dataArray[0]


    if (data.doc_id != this.docService._docList()[this.docService.lastDocNum()]?._id || data.page != this.docService.pageBuffer()[this.docService.lastDocNum()]) {
      this.dataArray.shift()
      return
    }

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

        context.clearRect(0, 0, target_canvas.width, target_canvas.height);
        this.drawingService.end(data_context, data.points, data.tool)
        this.dataArray.shift()
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
        }
        else if (data.tool.type === "highlighter") {
          context.globalCompositeOperation = 'xor';
          context.globalAlpha = 0.5;
          context.lineCap = "round";
          context.fillStyle = data.tool.color;
          context.strokeStyle = data.tool.color;
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

          context.clearRect(0, 0, target_canvas.width, target_canvas.height);

          // 최종 target에 그리기
          this.drawingService.end(data_context, data.points, data.tool)
          this.dataArray.shift()
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
    }

  }
}
