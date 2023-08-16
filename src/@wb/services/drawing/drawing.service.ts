import { Injectable } from '@angular/core';
import { EventBusService } from '../eventBus/event-bus.service';
import { EventData } from '../eventBus/event.class';

@Injectable({
  providedIn: 'root'
})
export class DrawingService {

  private sourceCanvas: any;
  textX1;
  textY1;
  textareaWidth;
  points;
  textValue;
  constructor(
    private eventBusService: EventBusService,
  ) { }
  /**
     * Drawing Start
     */
  start(context, points, tool, sourceCanvas) {
    switch (tool.type) {
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


  /**
   * Drawing Move
   */
  move(context, points, tool, zoomScale, sourceCanvas) {
    context.globalCompositeOperation = 'source-over';
    context.setLineDash([]);
    this.sourceCanvas = sourceCanvas
    context.lineCap = "round";
    context.lineJoin = 'round';
    if (tool.type != 'textarea') {
      context.lineWidth = tool.width;
    } else {
      context.lineWidth = 1
    }
    context.fillStyle = tool.color;
    context.strokeStyle = tool.color;

    let a;
    let b;
    let c;
    let d;
    let i;
    const len = points.length / 2; // x, y 1차원 배열로 처리 --> /2 필요.

    context.beginPath();
    console.log('move')
    switch (tool.type) {
      case 'pen': // Drawing은 새로운 부분만 그림 : 전체를 다시 그리면 예전 PC에서 약간 티가남...
        if (len < 3) {
          // context.moveTo(points[len-2].x, points[len-2].y);
          // context.lineTo(points[len-1].x, points[len-1].y);
          context.moveTo(points[2 * (len - 2)], points[2 * (len - 2) + 1]);
          context.lineTo(points[2 * (len - 1)], points[2 * (len - 1) + 1]);
          context.stroke();
          context.closePath();
          break;
        }

        // a = (points[len - 3].x + points[len - 2].x) / 2;
        // b = (points[len - 3].y + points[len - 2].y) / 2;
        // c = (points[len - 2].x + points[len - 1].x) / 2;
        // d = (points[len - 2].y + points[len - 1].y) / 2;
        a = (points[2 * (len - 3)] + points[2 * (len - 2)]) / 2;
        b = (points[2 * (len - 3) + 1] + points[2 * (len - 2) + 1]) / 2;
        c = (points[2 * (len - 2)] + points[2 * (len - 1)]) / 2;
        d = (points[2 * (len - 2) + 1] + points[2 * (len - 1) + 1]) / 2;

        context.moveTo(a, b);
        // context.quadraticCurveTo(points[len - 2].x, points[len - 2].y, c, d);
        context.quadraticCurveTo(points[2 * (len - 2)], points[2 * (len - 2) + 1], c, d);
        context.stroke();
        context.closePath();
        break;

      case 'eraser':	// 지우개는 cover canvas 초기화 후 처음부터 다시 그림 : eraser marker 표시용도...
        context.clearRect(0, 0, context.canvas.width / zoomScale, context.canvas.height / zoomScale);
        if (len < 3) {
          context.beginPath();
          // context.arc(points[0].x, points[0].y, tool.width/ 2, 0, Math.PI * 2, !0);
          context.arc(points[0], points[1], tool.width / 2, 0, Math.PI * 2, !0);
          context.fill();
          context.closePath();
          // eraser Marker
          // eraserMarker(context,points[len-1],tool.width);
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

        // eraser Marker
        this.eraserMarker(context, [points[2 * (len - 1)], points[2 * (len - 1) + 1]], tool.width);
        break;

      // https://github.com/SidRH/Drawing-Different-Shapes-using-JavaScript-on-Mousedrag-
      // https://github.com/demihe/HTML5-Canvas-Paint-Application/blob/bfdee5248a46c6955b52e2e23db8fc51dc785110/drawing.js#L206
      // 선 그리기
      case 'line':
        console.log('shape moving~~~~~~')
        context.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
        console.log(points)
        context.moveTo(points[0], points[1]);
        context.lineTo(points[2 * (len - 1)], points[2 * (len - 1) + 1]);
        context.quadraticCurveTo(points[2 * i], points[2 * i + 1], points[2 * (i + 1)], points[2 * (i + 1) + 1]);
        context.closePath();
        context.stroke();
        context.strokeStyle = tool.color;
        break;

      // https://github.com/SidRH/Drawing-Different-Shapes-using-JavaScript-on-Mousedrag-
      // https://github.com/demihe/HTML5-Canvas-Paint-Application/blob/bfdee5248a46c6955b52e2e23db8fc51dc785110/drawing.js#L206

      // 타원그리기
      case 'circle':
        if (len > 3) {
          context.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
          // https://stackoverflow.com/questions/21594756/drawing-circle-ellipse-on-html5-canvas-using-mouse-events
          var radiusX = (points[2 * (len - 1)] - points[0]) * 0.5,   /// radius for x based on input
            radiusY = (points[2 * (len - 1) + 1] - points[1]) * 0.5,   /// radius for y based on input
            centerX = points[0] + radiusX,      /// calc center
            centerY = points[1] + radiusY,
            step = 0.01,                 /// resolution of ellipse
            temp = step,                    /// counter
            pi2 = Math.PI * 2 - step;    /// end angle

          /// start a new path
          context.beginPath();

          /// set start point at angle 0
          context.moveTo(centerX + radiusX * Math.cos(0),
            centerY + radiusY * Math.sin(0));

          /// create the ellipse    
          for (; temp < pi2; temp += step) {
            context.lineTo(centerX + radiusX * Math.cos(temp),
              centerY + radiusY * Math.sin(temp));
          }

          /// close it and stroke it for demo
          context.closePath();
          context.stroke();
          context.strokeStyle = tool.color;
        }
        break;

      // 사각형 그리기
      case 'rectangle':
        if (len > 3) {
          console.log('shape moving~~~~~~')
          context.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
          console.log(points)
          context.strokeRect(points[0], points[1], (points[2 * (len - 1)] - points[0]), (points[2 * (len - 1) + 1] - points[1]));
          // fillRect는 색이 채워지고 strokeRect은 색이 채워지지 않는다.
          // context.fillRect(points[0], points[1], (points[2 * (len - 1)] - points[0]), (points[2 * (len - 1) + 1] - points[1]));
          context.closePath();
          context.stroke();
          context.strokeStyle = tool.color;
        }
        break;

      // https://github.com/goldfire/CanvasInput
      // https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-using-html-canvas
      // 모서리가 둥근 사각형 그리기

      case 'roundedRectangle':

        const x = points[0];
        const y = points[1];
        const width = (points[2 * (len - 1)] - points[0])
        const height = (points[2 * (len - 1) + 1] - points[1])
        let radius = 20;
        context.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
        if (points[0] > points[2 * (len - 1)]) {
          context.moveTo(x - radius, y);
        } else {
          context.moveTo(x + radius, y);
        }
        context.arcTo(x + width, y, x + width, y + height, radius);
        context.arcTo(x + width, y + height, x, y + height, radius);
        context.arcTo(x, y + height, x, y, radius);
        context.arcTo(x, y, x + width, y, radius);
        context.closePath();
        context.stroke();
        context.strokeStyle = tool.color;
        break;
      case 'pointer':
        context.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
        context.globalCompositeOperation = 'source-over';
        // context.lineCap = "round";
        context.lineJoin = 'round';
        context.fillStyle = 'red';
        // context.strokeStyle = 'black';
        context.lineWidth = 1; // check line width 영향...
        context.beginPath();
        context.arc(points[2 * (len - 1)], points[2 * (len - 1) + 1], 20 / 2, 0, Math.PI * 2, !0);
        context.fill();
        // context.stroke();
        context.closePath();
        document.getElementById('canvas').style.cursor = 'none'
        break;

      // 형광펜
      case 'highlighter':
        context.globalAlpha = 0.5;
        context.lineCap = "square";
        context.lineJoin = 'square';
        context.fillStyle = '#ff0';
        context.strokeStyle = '#ff0';
        context.clearRect(0, 0, context.canvas.width / zoomScale, context.canvas.height / zoomScale);
        if (len < 3) {
          context.beginPath();
          // context.arc(points[0], points[1], tool.width / 2, 0, Math.PI * 2, !0);
          context.fillRect(points[0] - (tool.width / 2), points[1] - (tool.width / 2), tool.width, tool.width);
          context.fill();
          context.closePath();
          // eraser Marker
          // eraserMarker(context,points[len-1],tool.width);
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

        // eraser Marker
        this.eraserMarker(context, [points[2 * (len - 1)], points[2 * (len - 1) + 1]], tool.width);
        break;

      case 'textarea':
        if (len > 3) {
          console.log('shape moving~~~~~~')
          context.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
          context.setLineDash([5, 10]);
          context.strokeRect(points[0], points[1], (points[2 * (len - 1)] - points[0]), (points[2 * (len - 1) + 1] - points[1]));
          // fillRect는 색이 채워지고 strokeRect은 색이 채워지지 않는다.
          // context.fillRect(points[0], points[1], (points[2 * (len - 1)] - points[0]), (points[2 * (len - 1) + 1] - points[1]));
          context.closePath();

          context.strokeStyle = tool.color;
        }
        break;

      default:
        break;
    }
  }

  end(context, points, tool, txt?, scale?, textareaPoints?) {
    // console.log(points)
    context.lineCap = "round";
    context.lineJoin = 'round';
    context.lineWidth = tool.width;
    context.strokeStyle = tool.color;
    context.fillStyle = tool.color;

    console.log('up----------------------')
    // cover canvas 초기화 후 다시 그림.
    // context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    let i;
    let c;
    let d;
    const len = points.length / 2;

    if (tool.type === "pointer") {
      return
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
        // console.log('end')
        for (i = 1; i < len - 2; i++) {
          // var c = (points[i].x + points[i + 1].x) / 2,
          // 	d = (points[i].y + points[i + 1].y) / 2;
          //	context.quadraticCurveTo(points[i].x, points[i].y, c, d);
          c = (points[2 * i] + points[2 * (i + 1)]) / 2;
          d = (points[2 * i + 1] + points[2 * (i + 1) + 1]) / 2;
          context.quadraticCurveTo(points[2 * i], points[2 * i + 1], c, d);
        }
        // context.quadraticCurveTo(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
        context.quadraticCurveTo(points[2 * i], points[2 * i + 1], points[2 * (i + 1)], points[2 * (i + 1) + 1]);
        context.stroke();
        context.closePath();
        break;

      // 선 함수
      case 'line':
        context.beginPath();
        context.moveTo(points[0], points[1]);
        context.lineTo(points[2 * (len - 1)], points[2 * (len - 1) + 1]);
        context.quadraticCurveTo(points[2 * i], points[2 * i + 1], points[2 * (i + 1)], points[2 * (i + 1) + 1]);
        context.closePath();
        context.stroke();
        context.strokeStyle = tool.color;
        break;

      // 타원 함수
      case 'circle':
        // https://stackoverflow.com/questions/21594756/drawing-circle-ellipse-on-html5-canvas-using-mouse-events
        var radiusX = (points[2 * (len - 1)] - points[0]) * 0.5,   /// radius for x based on input
          radiusY = (points[2 * (len - 1) + 1] - points[1]) * 0.5,   /// radius for y based on input
          centerX = points[0] + radiusX,      /// calc center
          centerY = points[1] + radiusY,
          step = 0.01,                 /// resolution of ellipse
          a = step,                    /// counter
          pi2 = Math.PI * 2 - step;    /// end angle

        /// start a new path
        context.beginPath();

        /// set start point at angle 0
        context.moveTo(centerX + radiusX * Math.cos(0),
          centerY + radiusY * Math.sin(0));

        /// create the ellipse    
        for (; a < pi2; a += step) {
          context.lineTo(centerX + radiusX * Math.cos(a),
            centerY + radiusY * Math.sin(a));
        }

        /// close it and stroke it for demo
        context.closePath();
        context.stroke();
        context.strokeStyle = tool.color;
        break;

      // 사각형 함수
      case 'rectangle':
        console.log('done')
        context.beginPath();
        context.strokeRect(points[0], points[1], (points[2 * (len - 1)] - points[0]), (points[2 * (len - 1) + 1] - points[1]));
        context.closePath();
        // fillRect는 색이 채워지고 strokeRect은 색이 채워지지 않는다.
        // context.fillRect(points[0], points[1], (points[2 * (len - 1)] - points[0]), (points[2 * (len - 1) + 1] - points[1]));
        context.strokeStyle = tool.color;
        break;

      // 모서리가 둥근 사각형 그리기
      case 'roundedRectangle':
        const x = points[0];
        const y = points[1];
        const width = (points[2 * (len - 1)] - points[0])
        const height = (points[2 * (len - 1) + 1] - points[1])
        let radius = 20;
        context.beginPath();
        if (points[0] > points[2 * (len - 1)]) {
          context.moveTo(x - radius, y);
        } else {
          context.moveTo(x + radius, y);
        }
        context.arcTo(x + width, y, x + width, y + height, radius);
        context.arcTo(x + width, y + height, x, y + height, radius);
        context.arcTo(x, y + height, x, y, radius);
        context.arcTo(x, y, x + width, y, radius);
        context.closePath();
        context.stroke();
        context.strokeStyle = tool.color;
        break;

      // 형광펜
      case 'highlighter':
        // context.globalCompositeOperation = 'color'
        context.globalAlpha = 0.5;
        context.lineCap = "square";
        context.lineJoin = 'round';
        context.fillStyle = '#ff0';
        context.strokeStyle = '#ff0';
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
        // console.log('end')
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
      // 글상자 textarea 생성
      // https://stackoverflow.com/questions/5026961/html5-canvas-ctx-filltext-wont-do-line-breaks
      case 'textarea':
        this.points = points
        //  textarea 생성
        var input = document.createElement('textarea');
        this.textX1 = points[0]; // 처음으로 마우스로 찍은 X값 좌표
        this.textY1 = points[1]; // 처음으로 마우스로 찍은 Y값 좌표
        var tempX;
        var textX2 = points[2 * (len - 1)]; // 마지막으로 찍은 X값 좌표
        var textY2 = points[2 * (len - 1) + 1]; // 마지막으로 찍은 Y값 좌표
        var tempY;
        input.id = 'textarea'
        input.style.position = 'fixed';
        input.style.fontSize = tool.width * scale + 'px';
        input.style.fontFamily = 'Verdana'
        input.style.overflow = "hidden"


        // 마우스를 좌상단 방향으로 드래그할 경우 textarea 위치가 이상하게 나옴
        // 첫 좌표가 마지막 좌표보다 클 경우 서로 위치를 바꿔야한다.
        if (this.textX1 > textX2) {
          tempX = this.textX1;
          this.textX1 = textX2;
          textX2 = tempX;
        }
        if (this.textY1 > textY2) {
          tempY = this.textY1;
          this.textY1 = textY2;
          textY2 = tempY;
        }

        // textarea의 가로 좌표
        if (textareaPoints[0] > textareaPoints[2]) {
          input.style.left = textareaPoints[2] + 'px';
        } else {
          input.style.left = textareaPoints[0] + 'px';
        }

        // textarea의 세로 좌표
        if (textareaPoints[1] > textareaPoints[3]) {
          input.style.top = textareaPoints[3] + 'px';
        } else {
          input.style.top = textareaPoints[1] + 'px';
        }

        // textarea의 넓이
        this.textareaWidth = (textX2 - this.textX1)
        // textarea의 길이
        let textareaHeight = (textY2 - this.textY1)

        // textarea 최소 길이 높이 설정
        if (textX2 - this.textX1 < 180 / scale) {
          this.textareaWidth = 180 / scale
        }
        if (textY2 - this.textY1 < 26 / scale) {
          textareaHeight = 26 / scale
        }

        input.style.width = this.textareaWidth * scale + 'px';
        input.style.height = textareaHeight * scale + 'px';


        // body에 textarea 추가
        document.body.appendChild(input);
        break;

      case 'text': // textarea를 생성하고나면 text모드로 자동으로 변경
        // 이벤트 버스를 사용, 드로잉 이벤트가 끝이나면 text를 썸네일로 보낸다.
        const eventBusService = this.eventBusService;

        // textarea의 줄바꿈시 그려야할 y값 좌표가 한줄 씩 내려간다(바뀐다.).
        // 이때 변경된 y 좌표를 담고 있는 변수 drawHeight
        let drawHeight;

        // textarea html태그 추출
        var textInput = (<HTMLInputElement>document.getElementById('textarea'));
        this.textValue = textInput?.value

        // ****코드 리팩토링 필요
        // textInput?.value가 있으면 textarea로 값을 가져온다('text모드에서 element가 생성된 경우')
        // textInput?.value가 없는 경우는 zoom과 같이 textarea가 element에서 값을 가져오는게 아니라
        // drawStorage에서 값을 불러오는 경우 사용
        // this.textValue가 ''일 경우 문제 발생 '' 실행안하게 조건문을 넣는다.
        if (textInput) {
          // textarea 삭제
          textInput.parentNode.removeChild(textInput);

          // https://stackoverflow.com/questions/33771676/how-to-create-a-dynamic-drawing-text-box-in-html-canvas
          // Draw the text onto canvas:
          console.log(this.textValue);
          drawText(this.textValue, this.textX1 + 2, this.textY1 + 2, this.textareaWidth - 0.5, scale);

          // drawStorage에 좌표랑, 텍스트 저장
          const drawingEvent = {
            points: this.points,
            tool,
            txt: this.textValue,
          };
          eventBusService.emit(new EventData('gen:newDrawEvent', drawingEvent));


          // 초기화
          this.textX1 = 0
          this.textY1 = 0
          this.textareaWidth = 0
          this.points = []

        } else if (txt) {

          // drawStorage에서 points 좌표를 가져왔기 때문에 다시 계산
          // 썸네일을 그리거나, zoom을 할 경우 여기서 실행된다.
          console.log(points[0]);
          var textX1 = points[0] + 2;
          var textY1 = points[1] + 2;
          var tempX;
          var textX2 = points[2 * (points.length / 2 - 1)];
          var textY2 = points[2 * (points.length / 2 - 1) + 1];
          var tempY;


          // 첫 좌표가 마지막 좌표보다 클 경우
          if (textX1 > textX2) {
            tempX = textX1;
            textX1 = textX2;
            textX2 = tempX;
          }
          if (textY1 > textY2) {
            tempY = textY1;
            textY1 = textY2;
            textY2 = tempY;
          }

          // textarea의 넓이
          let textareaWidth = (textX2 - textX1) - 0.5;

          // textarea 최소 길이 높이 설정
          if (textareaWidth < 180) {
            textareaWidth = 180
          }

          drawText(txt, textX1, textY1, textareaWidth, scale);
        }


        function drawText(txt, x, y, width, scale?) {
          context.textBaseline = 'top'; // 글씨 위치 지정
          context.textAlign = 'left';
          context.font = tool.width + 'px Verdana'; // 글씨 폰트 지정

          // txt.split("\n")은 textarea의 input값 중
          // 줄바꿈("\n")을 기준으로 배열 생성
          // aaa  
          // aaa  일 경우    ['aaa','aaa','aaa'] 로 출력 
          // aaa
          var lines = txt?.split("\n");
          var lineHeight = tool.width * 1.5; // 한줄 높이 지정
          drawHeight = y + 7; // 줄 바꿈시 y값 좌표가 바뀐다. drawHeight는 이를 담고 있는 변수  
          for (var i = 0; i < lines.length; i++) {
            // context.measureText(lines[i]).width textarea의 value의 길이
            // 입력한 값이 textarea 넓이보다 길면 다음 줄로 내려가게 한다.
            // 'printAt' 함수가 줄바꿈 기능을 한다.
            // 만약 입력한 값이 textarea 넓이보다 짧으면 
            // 'fillText' 함수로 바로 그려버린다.
            if (context.measureText(lines[i]).width * scale > width * scale) {
              console.log(context.measureText(lines[i]).width)
              printAt(context, lines[i].substr(0), x, drawHeight, lineHeight, width);
            } else {
              context.fillText(lines[i], x, drawHeight);
              // 한줄 그린 후 다음 줄로 넘어가기 위해
              // 줄 길이 만큼 y좌표에 더 한다.
              drawHeight += lineHeight;
            }
          }


        }

        // textarea의 값의 길이가 textarea의 너비보다 길 경우 줄바꿈 함수
        function printAt(context, text, x, y, lineHeight, fitWidth) {
          // textarea의 넓이 보다 긴 한줄을 한글자씩 분해  
          for (var idx = 1; idx <= text.length; idx++) {
            // 분해한 글짜가 textarea보다 짧으면 함수 실행없이 
            // 그냥 한바퀴 돈다.(분해한 글자 하나 더해진다)
            var str = text.substr(0, idx);
            // 분해한 글자 하나씩 더해지다가 textarea보다 길어지면
            // canvas에 한줄 그리고 한줄 띄운다
            if (context.measureText(str).width > fitWidth) {
              // 3 이랑 6 은 아주 약간의 위치 조정
              context.fillText(text.substr(0, idx - 1), x, y + 3);
              drawHeight = y + lineHeight
              printAt(context, text.substr(idx - 1), x, drawHeight, lineHeight, fitWidth);
              return;
            }
          }
          // 마지막 줄을 canvas에 그려주고
          // y좌표를 줄 높이 만큼 더 해준다.
          // 3 이랑 6 은 아주 약간의 위치 조정
          context.fillText(text, x, y + 3);
          drawHeight = y + lineHeight
        }

        break;

      default:
        break;

    }

  }

  /**
       * 지우개 marker 표시
       */
  eraserMarker(ctx, point, width) {
    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'white';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(point[0], point[1], width / 2, 0, Math.PI * 2, !0);
    ctx.stroke();
    ctx.closePath();
  }

  // Thumbnail에 그리기
  drawThumb(data, thumbCanvas, thumbScale) {
    console.log('drawThumb--------------------------')
    console.log(data)
    const thumbCtx = thumbCanvas.getContext('2d');
    // prepare scale
    thumbCtx.save();
    thumbCtx.scale(thumbScale, thumbScale);
    this.end(thumbCtx, data.points, data.tool, data.txt, 1);
    thumbCtx.restore();
  }

  // Thumbnail에 그리기
  clearThumb(data, thumbCanvas, thumbScale) {
    console.log('clearThumb')
    console.log(thumbCanvas)
    console.log(thumbScale)
    const thumbCtx = thumbCanvas.getContext('2d');
    thumbCtx.clearRect(0, 0, thumbCanvas.width / thumbScale, thumbCanvas.height / thumbScale);

  }

  dataArray: any = [];
  stop: any = null;
  //  
  /**
 * page 전환 등...--> 기존에 그려지고 있던 event stop.
 */
  stopRxDrawing() {
    if (this.stop) {
      clearInterval(this.stop);
      this.stop = null;
    }
    this.dataArray = [];
  }

  /**
     * page 전환 등...--> 기존에 그려지고 있던 event stop.
     *
     */
  async rxPointer(data, sourceCanvas, targetCanvas, scale, docNum, pageNum) {
    console.log(data)
    console.log('rxPointer-------------------------')
    const context = sourceCanvas.getContext("2d");
    context.globalCompositeOperation = 'source-over';
    // context.lineCap = "round";
    context.lineJoin = 'round';
    context.fillStyle = 'red';
    // context.strokeStyle = 'black';
    // context.lineWidth = 1; // check line width 영향...
    context.beginPath();
    context.clearRect(0, 0, sourceCanvas.width / scale, sourceCanvas.height / scale);
    context.arc(data.points[0], data.points[1], 20 / 2, 0, Math.PI * 2, !0);
    context.fill();
    // context.stroke();

    // 포인터 추가 부분 //////////
    if (data.tool.type == 'pointer') {
      context.shadowColor = "red";
      context.shadowBlur = 30;
    }
    ////////////////////////////////////////

    context.closePath();
    return;

  }


  /**
   * page 전환 등...--> 기존에 그려지고 있던 event stop.
   *
   */
  async rxDrawing(data, sourceCanvas, targetCanvas, scale, docNum, pageNum) {
    const tmpData = {
      data,
      sourceCanvas,
      targetCanvas,
      scale,
      docNum,
      pageNum
    };

    this.dataArray.push(tmpData);
    // 하나의 event인 경우 그리기 시작.
    if (this.dataArray.length === 1) {
      this.rxDrawingFunc();
    }
  }


  async rxDrawingFunc() {
    console.log('rxDrawingFunc~~~~~~~~~~')
    if (this.dataArray.length === 0) return;

    const data = await this.dataArray[0].data;
    const sourceCanvas = this.dataArray[0].sourceCanvas;
    const context = sourceCanvas.getContext("2d");
    const targetCanvas = this.dataArray[0].targetCanvas;
    const targetContext = targetCanvas.getContext("2d");
    const scale = this.dataArray[0].scale;

    if (data.tool.type == 'line' || data.tool.type == 'circle'
      || data.tool.type == 'rectangle' || data.tool.type == 'roundedRectangle' || data.tool.type == 'text'
    ) {
      // context.clearRect(0, 0, sourceCanvas.width / scale, sourceCanvas.height / scale);
      this.end(targetContext, data.points, data.tool, data.txt, scale);
      this.dataArray.shift();
      this.rxDrawingFunc();
      return;
    }


    const pointsLength = data.points.length / 2;

    context.lineCap = "round";
    context.lineJoin = 'round';
    context.globalAlpha = 1;
    context.lineWidth = data.tool.width;

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
      context.lineCap = "square";
      context.fillStyle = '#ff0';
      context.strokeStyle = '#ff0';
    }

    if (data.tool.type === "pen" || data.tool.type === "eraser" || data.tool.type === "highlighter") {
      if (pointsLength < 3) {
        context.beginPath();
        context.arc(data.points[0], data.points[1], data.tool.width / 2, 0, Math.PI * 2, !0);
        context.fill();
        context.closePath();

        context.clearRect(0, 0, sourceCanvas.width / scale, sourceCanvas.height / scale);
        this.end(targetContext, data.points, data.tool);

        this.dataArray.shift();
        this.rxDrawingFunc();
        return;

      }

      let i = 2;

      this.stop = setInterval(() => {
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

          this.dataArray.shift();
          context.clearRect(0, 0, sourceCanvas.width / scale, sourceCanvas.height / scale);

          // 최종 target에 그리기
          this.end(targetContext, data.points, data.tool);

          // 다음 event 그리기 시작.
          this.rxDrawingFunc();
        }

      }, data.timeDiff / pointsLength);
    }
  }
  /**
   * 수신 DATA 썸네일에 그리기
   *
   * @param data
   * @param thumbCanvas
   * @param thumbScale
   */
  rxDrawingThumb(data, thumbCanvas, thumbScale) {
    console.log('drawThumbRX--------------------------')
    const thumbCtx = thumbCanvas.getContext('2d');
    // prepare scale
    thumbCtx.save();
    thumbCtx.scale(thumbScale, thumbScale);
    this.end(thumbCtx, data.points, data.tool, data.txt);
    thumbCtx.restore();
  }
}
