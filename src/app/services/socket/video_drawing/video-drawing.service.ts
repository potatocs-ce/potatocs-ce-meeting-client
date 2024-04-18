import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VideoDrawingService {
  // 여기 비디오 위에서 그려진 그림들 전송하는 로직 작성
  constructor() { }

  // {socket_id: , drawingEvent}
  drawVarArray: any = signal<Object>({})

}
