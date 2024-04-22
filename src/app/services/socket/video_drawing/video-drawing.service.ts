import { Injectable, effect, signal } from '@angular/core';
import { DrawingService } from '../../drawing/drawing.service';

@Injectable({
  providedIn: 'root'
})
export class VideoDrawingService {
  // 여기 비디오 위에서 그려진 그림들 전송하는 로직 작성


  stop: any = null;

  // 그림 데이터 큐
  dataArray: any = [];

  // 비디오 그림 전체 데이터
  drawVarArray: any = signal<Object>({})


  constructor(
    private drawingService: DrawingService
  ) {
    effect(async () => {
      // 사용자별로 구분하는 것도 필요할듯
      if (Object.keys(this.drawVarArray()).length) {
        const [firstKey, firstValue]: any = Object.entries(this.drawVarArray())[0];
        console.log(firstValue[firstValue.length - 1])

        this.dataArray.push(firstValue[firstValue.length - 1]);
        if (this.dataArray.length == 1) {
          this.drawingQueue();
        }

      }
    })
  }

  // {socket_id: , drawingEvent}

  async drawingQueue() {
    if (!this.dataArray.length) return

    const data_canvas: any = document.getElementById('data_canvas');
    const data_context: any = data_canvas.getContext('2d');
    const target_canvas: any = document.getElementById('target_canvas');
    const context: any = target_canvas.getContext('2d');



    const data = this.dataArray[0]
    console.log(data, this.dataArray)
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
    }

  }
}
