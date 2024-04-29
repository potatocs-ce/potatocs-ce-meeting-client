import { Injectable } from '@angular/core';
import { DrawingService } from '../drawing/drawing.service';
import { Socket } from 'ngx-socket-io';
import { VideoDrawingService } from '../socket/video_drawing/video-drawing.service';
import { MeetingService } from '../meeting/meeting.service';
import { AuthService } from '../auth/auth.service';


@Injectable({
  providedIn: 'root'
})
export class CanvasService {
  listenerSet: any = [];

  constructor(private socket: Socket,
    private drawingService: DrawingService,
    private videoDrawingService: VideoDrawingService,
    private meetingService: MeetingService,
    private authService: AuthService) {
    this.socket.on('draw:video', async (data: any) => {
      let drawVarArray = this.videoDrawingService.drawVarArray();

      if (drawVarArray[data.target_id]) {
        drawVarArray[data.target_id].push(data.drawingEvent);
      } else {
        drawVarArray[data.target_id] = [data.drawingEvent];
      }
      this.videoDrawingService.lastUser.set(data.target_id)
      this.videoDrawingService.drawVarArray.set({ ...drawVarArray })
    })
  }


  getDeviceScale(canvas: any) {
    const ctx = canvas.getContext('2d');

    const devicePixelRatio = window.devicePixelRatio || 1;
    const backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
      ctx.mozBackingStorePixelRatio ||
      ctx.msBackingStorePixelRatio ||
      ctx.oBackingStorePixelRatio ||
      ctx.backingStorePixelRatio || 1;

    let deviceScale = 1;

    if (navigator.userAgent.indexOf('Android') > -1 || navigator.userAgent.indexOf('Linux') > -1) {
      deviceScale = devicePixelRatio / backingStoreRatio;
    }

    return deviceScale;
  }
  /**
   * Canvas에 event listener 추가
   * @param {canvas element} sourceCanvas event를 받아들일 canvas
   * @param {canvas element} targetCanvas event가 최종적으로 그려질 canvas
   * @param {object} tool  사용 tool (type, color, width)
   * @param {number} zoomScale 현재의 zoom scale
   */
  addEventHandler(sourceCanvas: any, targetCanvas: any, tool: any, zoomScale: any) {
    // console.log(">>>> Add Event handler:", tool, zoomScale);
    const drawingService = this.drawingService;
    // const eventBusService = this.eventBusService;
    // const editInfoService = this.editInfoService;

    const sourceCtx = sourceCanvas.getContext("2d");
    const targetCtx = targetCanvas.getContext("2d");

    let oldPoint: any = {};
    let newPoint: any = {};
    let points: any = [];
    let textareaPoints: any = []; // textarea를 그릴 때 사용하는 좌표

    // var maxNumberOfPointsPerSocket = 100;
    let startTime: any = null;
    let endTime = null;

    let isDown = false;
    let isTouch = false;

    const scale = zoomScale || 1;

    // **************************** Mouse/touch Event **************************************** //
    // sourceCanvas.onmousedown = sourceCanvas.ontouchstart = downEvent;
    // sourceCanvas.onmousemove = sourceCanvas.ontouchmove = moveEvent;
    // sourceCanvas.onmouseout = sourceCanvas.onmouseup = sourceCanvas.ontouchend = upEvent;
    // *************************************************************************************** //

    for (const item of this.listenerSet) {
      if (item.id === sourceCanvas.id) {
        sourceCanvas.removeEventListener(item.name, item.handler);
      }
    }
    // sourceCanvas가 동일한 경우에 대한 내용 삭제.
    this.listenerSet = this.listenerSet.filter((item: any) => item.id !== sourceCanvas.id);



    // console.log(this.listenerSet);

    function downEvent(event: any) {
      event.preventDefault();
      isDown = true;
      // 시작시 touch/mouse가 동시에 발생할 때 (chrome dev 등)
      // --> touch기준으로 나머지 drawing 동작.
      if (event.touches) {
        isTouch = true;
      }

      // textareaPoints는 textarea를 만들때 사용 
      if (tool.type == 'textarea') {
        textareaPoints = [event.clientX, event.clientY]; // textarea 그릴때 사용하는 좌표 저장
      }

      oldPoint = getPoint(isTouch ? event.touches[0] : event, event.target, scale);
      points = oldPoint;

      drawingService.start(sourceCtx, points, tool, sourceCanvas);


      startTime = Date.now();
      event.preventDefault();
    };


    // kje: todo: mouse와 touch가 move 도중에 중복되는 경우는 없는지 확인...
    function moveEvent(event: any) {
      if (!isDown) return;

      newPoint = getPoint(isTouch ? event.touches[0] : event, event.target, scale);
      if (oldPoint[0] !== newPoint[0] || oldPoint[1] !== newPoint[1]) {
        oldPoint = newPoint;
        points.push(oldPoint[0]); // x
        points.push(oldPoint[1]); // y
        drawingService.move(sourceCtx, points, tool, scale, sourceCanvas); // scale: eraser marker 정확히 지우기 위함.	

        event.preventDefault();
        // console.log(points)
      }
    };

    const upEvent = (event: any) => {

      if (!isDown) return;
      isDown = false;
      isTouch = false;
      sourceCtx.globalAlpha = 1
      // 레이저 포인트일경우

      // textareaPoints는 textarea를 만들때 사용 
      if (tool.type == 'textarea') {
        textareaPoints.push(event.clientX, event.clientY)
      }

      drawingService.end(targetCtx, points, tool, '', scale, textareaPoints);
      event.preventDefault();

      // if (tool.type == 'text') {
      //   const editInfo = Object.assign({}, editInfoService.state);
      //   editInfo.tool = 'textarea';
      //   editInfoService.setEditInfo(editInfo);
      //   return clear(sourceCanvas, scale);
      // }

      // if (tool.type == 'textarea') {
      //   const editInfo = Object.assign({}, editInfoService.state);
      //   editInfo.tool = 'text';
      //   editInfoService.setEditInfo(editInfo);
      //   return clear(sourceCanvas, scale);
      // }

      // if (tool.type == 'pointer') {
      //   sourceCtx.shadowColor = "";
      //   sourceCtx.shadowBlur = 0;
      //   tool.type = 'pointerEnd';
      //   eventBusService.emit(new EventData('gen:newDrawEvent', {
      //     points: newPoint,
      //     tool
      //   }));
      //   tool.type = 'pointer';
      //   document.getElementById('canvas').style.cursor = 'default'
      //   points = [];
      //   return clear(sourceCanvas, scale);
      // }

      /*----------------------------------------------
        Drawing Event 정보
        -> gen:newDrawEvent로 publish.
      -----------------------------------------------*/
      endTime = Date.now();
      const drawingEvent = {
        points,
        tool,
        timeDiff: endTime - startTime
      };

      // Generate Event Emitter: new Draw 알림
      // eventBusService.emit(new EventData('gen:newDrawEvent', drawingEvent));
      // user (적은 사람과) target (적힌 사람 구분)
      this.socket.emit('draw:video', { room_id: this.meetingService.meeting_room_id(), data: drawingEvent, target_id: sourceCanvas.parentNode.id, user_id: this.authService.getTokenInfo()._id })




      let drawVarArray = this.videoDrawingService.drawVarArray();

      if (drawVarArray[sourceCanvas.parentNode.id]) {
        drawVarArray[sourceCanvas.parentNode.id].push(drawingEvent);
      } else {
        drawVarArray[sourceCanvas.parentNode.id] = [drawingEvent];
      }
      this.videoDrawingService.drawVarArray.set({ ...drawVarArray })




      // 3. cover canvas 초기화
      clear(sourceCanvas, scale);

      // points = [];

      console.log('upEvent', points)
    };
    /**
     * canvas 초기화
     * @param {canvas element} targetCanvas
     * @param {number} zoomScale
     */
    function clear(targetCanvas: any, zoomScale: any) {
      const targetCtx = targetCanvas.getContext('2d');
      const scale = zoomScale || 1;
      targetCtx.clearRect(0, 0, targetCanvas.width / scale, targetCanvas.height / scale);
    }

    /**
     * Point 받아오기
     * - zoom인 경우 zoom 처리 전의 좌표 *
     * @param {*} event touch 또는 mouse event
     * @param {*} target event를 받아들이는 canvas
     * @param {*} zoomScale 현재의 zoom scale
     */
    function getPoint(event: any, target: any, zoomScale: any) {
      const canvasRect = target.getBoundingClientRect();
      // console.log(event.clientX - canvasRect.left, event.clientY - canvasRect.top);
      const scale = zoomScale || 1;
      const point = [Math.round((event.clientX - canvasRect.left) / scale), Math.round((event.clientY - canvasRect.top) / scale)];
      return point;
    }
    sourceCanvas.addEventListener('mousedown', downEvent);
    sourceCanvas.addEventListener('mousemove', moveEvent);
    sourceCanvas.addEventListener('mouseup', upEvent);
    sourceCanvas.addEventListener('mouseout', upEvent);
    sourceCanvas.addEventListener('touchstart', downEvent);
    sourceCanvas.addEventListener('touchmove', moveEvent);
    sourceCanvas.addEventListener('touchend', upEvent);

    this.listenerSet.push({ id: sourceCanvas.id, name: 'mousedown', handler: downEvent });
    this.listenerSet.push({ id: sourceCanvas.id, name: 'mousemove', handler: moveEvent });
    this.listenerSet.push({ id: sourceCanvas.id, name: 'mouseup', handler: upEvent });
    this.listenerSet.push({ id: sourceCanvas.id, name: 'mouseout', handler: upEvent });
    this.listenerSet.push({ id: sourceCanvas.id, name: 'touchstart', handler: downEvent });
    this.listenerSet.push({ id: sourceCanvas.id, name: 'touchmove', handler: moveEvent });
    this.listenerSet.push({ id: sourceCanvas.id, ame: 'touchend', handler: upEvent });

  }
}
