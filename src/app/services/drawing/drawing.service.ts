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

  // 지우개 마카 - 여러 부분에서 사용
  eraserMarker(context: any, points: any, width: any) {
    context.strokeStyle = 'black';
    context.fillStyle = 'white';
    context.lineWidth = 1.1;
    context.beginPath();
    context.arc(points[0], points[1], width / 2, 0, Math.PI * 2, !0);
    // 윤곽선
    context.stroke();
    context.closePath();
  }

  /**
   * 터치 & 클릭을 시작했을 경우
   * @param context 캔버스 컨택스트
   * @param points 좌표 값
   * @param tool 현재 무슨 모드인지
   * @param sourceCanvas 캔버스 html tag
   */
  start(context: any, points: any, tool: any, sourceCanvas: any) {
    switch (tool.type) {
      case 'pen':
        // 기존 캔버스 콘텐츠 위에 새 모양을 그림
        context.globalCompositeOperation = 'source-over';
        // 선의 끝을 둥글게 처리
        context.lineCap = 'round';
        // 연결된 세그먼트 공통 끝점 중심에 디스크의 추가 섹터를 채워 모양의 모서리를 둥글게 만듬
        context.lineJoin = 'round';
        // 색 설정
        context.fillStyle = tool.color;
        // 윤곽선 색 설정
        context.strokeStyle = tool.color;
        // 선 두께
        context.lineWidth = tool.width;
        // 하위 경로를 비워서 새 경로를 만듬
        context.beginPath();
        // arc는 원을 그리는 메서드
        // x,y, 너비, 시작 각도, 끝 각도, 
        context.arc(points[0], points[1], tool.width / 2, 0, Math.PI * 2, true);
        // 설정된 값을 채움
        context.fill();
        // 현재 지점에서 현재 하위 경로의 시작 부분까지 직선을 추가하려 시도
        context.closePath();
        break;
      case 'eraser':
        // 
        this.eraserMarker(context, [points[0], points[1]], tool.width);
        break;
      case 'highlighter':
        context.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
        context.globalAlpha = 0.5;
        context.lineCap = 'round';
        context.lingJoin = 'round';
        context.beginPath();
        context.fillStyle = tool.color;

        context.fillRect(points[0] - (tool.width / 2), points[1] - (tool.width / 2), tool.width, tool.width);
        context.fill();

        context.closePath();
        break;
      default:
        break;
    }
  }


  /**
   * 클릭한 상태로 움직일 경우
   * @param context 
   * @param points 
   * @param tool 
   * @param zoomScale 
   * @param sourceCanvas 
   */
  move(context: any, points: any, tool: any, zoomScale: any, sourceCanvas: any) {
    context.globalCompositeOperation = 'source-over';
    context.setLineDash([]);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = tool.width;
    context.fillStyle = tool.color;
    context.strokeStyle = tool.color;
    context.beginPath();
    // 그리기 동작이 점들의 쌍으로 이루어져있기 때문에 2로 나눔
    const len = points.length / 2; // x,y 1차원 배열로 처리

    let a: any; // 첫 번째 제어점의 x축 좌표
    let b: any; // 첫 번째 제어점의 y축 좌표
    let c: any; // 두 번째 제어점의 x축 좌표
    let d: any; // 두 번째 제어점의 y축 좌표

    let i: any;

    switch (tool.type) {
      case 'pen':
        // 2개면
        if (len < 3) {
          context.moveTo(points[2 * (len - 2)], points[2 * (len - 2) + 1]);
          context.lineTo(points[2 * (len - 1)], points[2 * (len - 1) + 1]);
          context.stroke();
          context.closePath();
          break;
        }

        a = (points[2 * (len - 3)] + points[2 * (len - 2)]) / 2;
        b = (points[2 * (len - 3) + 1] + points[2 * (len - 2) + 1]) / 2;
        c = (points[2 * (len - 2)] + points[2 * (len - 1)]) / 2;
        d = (points[2 * (len - 2) + 1] + points[2 * (len - 1) + 1]) / 2;

        context.moveTo(a, b);
        context.quadraticCurveTo(points[2 * (len - 2)], points[2 * (len - 2) + 1], c, d);
        context.stroke();
        context.closePath();
        break;
      case 'eraser': // 지운개는 cover canvas 초기화 후 처음부터 다시 그림: eraser marker 표시 용도
        context.clearRect(0, 0, context.canvas.width / zoomScale, context.canvas.height / zoomScale);

        if (len < 3) {
          context.beginPath();
          context.arc(points[0], points[1], tool.width / 2, 0, Math.PI * 2, !0);
          context.fill();
          context.closePath();
          this.eraserMarker(context, [points[2 * (len - 1)], points[2 * (len - 1) + 1]], tool.width);
          break;
        }

        context.moveTo(points[0], points[1]);
        for (i = 1; i < len - 2; i++) {
          c = (points[2 * i] + points[2 * (i + 1)]) / 2;
          d = (points[2 * i + 1] + points[2 * (i + 1) + 1]) / 2;
          context.quadraticCurveTo(points[2 * i], points[2 * i + 1], c, d);
        }

        context.quadraticCurveTo(points[2 * i], points[2 * i + 1], points[2 * (i + 1)], points[2 * (i + 1) + 1]);
        context.stroke();
        context.closePath();


        this.eraserMarker(context, [points[2 * (len - 1)], points[2 * (len - 1) + 1]], tool.width);
        break;

      case 'highlighter':
        context.globalAlpha = 0.5;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.fillStyle = tool.color;
        context.strokeStyle = tool.color;
        context.clearRect(0, 0, context.canvas.width / zoomScale, context.canvas.height / zoomScale);
        if (len < 3) {
          context.beginPath();
          // context.arc(points[0], points[1], tool.width / 2, 0, Math.PI * 2, !0);
          context.fillRect(points[0] - (tool.width / 2), points[1] - (tool.width / 2), tool.width, tool.width);
          context.fill();
          context.closePath();
          this.eraserMarker(context, [points[2 * (len - 1)], points[2 * (len - 1) + 1]], tool.width);
          break;
        }

        context.moveTo(points[0], points[1]);
        for (i = 1; i < len - 2; i++) {
          c = (points[2 * i] + points[2 * (i + 1)]) / 2;
          d = (points[2 * i + 1] + points[2 * (i + 1) + 1]) / 2;
          context.quadraticCurveTo(points[2 * i], points[2 * i + 1], c, d);
        }

        context.quadraticCurveTo(points[2 * i], points[2 * i + 1], points[2 * (i + 1)], points[2 * (i + 1) + 1]);
        context.stroke();
        context.closePath();
        this.eraserMarker(context, [points[2 * (len - 1)], points[2 * (len - 1) + 1]], tool.width);
        break;
      default:
        break;
    }
  }


  /**
   * 마우스 & 터치가 끝났을 경우
   * @param context 
   * @param points 
   * @param tool 
   * @param txt 
   * @param scale 
   * @param textareaPoints 
   */
  end(context: any, points: any, tool: any, txt?: any, scale?: any, textareaPoints?: any) {

    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = tool.width;
    context.strokeStyle = tool.color;
    context.fillStyle = tool.color;

    let i: any;
    let c: any;
    let d: any;
    const len = points.length / 2;

    if (tool.type == 'pointer') {
      return;
    } else if (tool.type === "pen" || tool.type === "line" || tool.type === "circle" ||
      tool.type === "rectangle" || tool.type === "roundedRectangle" || tool.type === "highlighter" || tool.type === "text") {
      context.globalCompositeOperation = 'source-over';
    } else {
      context.globalCompositeOperation = 'destination-out';
    }

    switch (tool.type) {
      case 'pen':
      case 'eraser':
        if (len < 3) {
          context.beginPath();
          context.arc(points[0], points[1], tool.width / 2, 0, Math.PI * 2, !0);
          context.fill();
          context.closePath();
          return;
        }

        context.beginPath();
        context.moveTo(points[0], points[1]);
        for (i = 1; i < len - 2; i++) {
          c = (points[2 * i] + points[2 * (i + 1)]) / 2;
          d = (points[2 * i + 1] + points[2 * (i + 1) + 1]) / 2;
          context.quadraticCurveTo(points[2 * i], points[2 * i + 1], c, d);
        }

        context.quadraticCurveTo(points[2 * i], points[2 * i + 1], points[2 * (i + 1)], points[2 * (i + 1) + 1]);
        context.stroke();
        context.closePath();
        break;
      case 'highlighter':
        context.globalAlpha = 0.5;
        context.lineCap = "round";
        context.lineJoin = 'round';
        context.fillStyle = tool.color;
        context.strokeStyle = tool.color;

        if (len < 3) {
          context.beginPath();
          context.fillRect(points[0] - (tool.width / 2), points[1] - (tool.width / 2), tool.width, tool.width);
          context.fill();
          context.closePath();
          context.globalAlpha = 1
          return;
        }

        context.beginPath();
        context.moveTo(points[0], points[1]);
        for (i = 1; i < len - 2; i++) {
          c = (points[2 * i] + points[2 * (i + 1)]) / 2;
          d = (points[2 * i + 1] + points[2 * (i + 1) + 1]) / 2;
          context.quadraticCurveTo(points[2 * i], points[2 * i + 1], c, d);
        }
        context.quadraticCurveTo(points[2 * i], points[2 * i + 1], points[2 * (i + 1)], points[2 * (i + 1) + 1]);
        context.stroke();
        context.closePath();
        context.globalAlpha = 1
        break;
    }
  }
}
