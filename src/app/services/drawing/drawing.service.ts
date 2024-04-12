import { Injectable, effect } from '@angular/core';
import { VideoService } from '../video/video.service';
import { ToggleService } from '../toggle/toggle.service';

@Injectable({
  providedIn: 'root'
})
export class DrawingService {

  mode: string = '';
  color: string = '';
  pen_width: number = 0;

  constructor(private toggleService: ToggleService) {
    effect(() => {
      this.mode = this.toggleService.toggle_drawing_mode();
      this.color = this.toggleService.toggle_color();
      this.pen_width = this.toggleService.toggle_width();
    })
  }

  /**
   * 그리기 시작
   */
  start(context: any, points: any, sourceCanvas: any) {
    switch (this.mode) {
      case 'pen':
        context.globalCompositeOperation = 'source-over';
        context.lineCap = "round";
        context.lineJoin = 'round';
        context.fillStyle = tool.color;
        context.strokeStyle = tool.color;
        context.lineWidth = 1; // check line width 영향...
        context.beginPath();
        context.arc(points[0], points[1], tool.width / 2, 0, Math.PI * 2, !0);
        context.fill();
        console.log('Start')
        context.closePath();
        break;
      case 'eraser':
        // eraser Marker 표시
        this.eraserMarker(context, [points[0], points[1]], tool.width);
        break;
      // 포인터
      case 'pointer':
        context.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
        context.globalCompositeOperation = 'source-over';
        context.lineCap = "round";
        context.lineJoin = 'round';
        // context.strokeStyle = 'black';
        // context.lineWidth = 1; // check line width 영향...
        context.beginPath();
        context.arc(points[0], points[1], 20 / 2, 0, Math.PI * 2, !0);
        context.fillStyle = 'red';

        // context.stroke();
        // 포인터 추가 부분 //////////
        context.shadowColor = "red";
        context.shadowBlur = 30;
        // context.globalAlpha = 0.7;
        document.getElementById('canvas').style.cursor = 'none'
        ////////////////////////////////////////
        context.fill();

        context.closePath();
        break;
      case 'highlighter':
        context.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
        // context.globalCompositeOperation = 'color'
        context.globalAlpha = 0.5;
        context.lineCap = "square";
        context.lineJoin = 'square';
        context.beginPath();
        context.fillStyle = '#ff0';

        context.fillRect(points[0] - (tool.width / 2), points[1] - (tool.width / 2), tool.width, tool.width);
        context.fill();

        context.closePath();
        break;
      default:
        break;
    }
  }


  move() {

  }

  end() {

  }
}
