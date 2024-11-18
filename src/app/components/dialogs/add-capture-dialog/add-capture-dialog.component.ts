import { CommonModule } from '@angular/common';
import { Component, effect, Inject, NgZone } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ToolService } from '../../../services/tool/tool.service';
import { CanvasService } from '../../../services/canvas/canvas.service';
import { StackImageService } from '../../../services/stackImage/stack-image.service';
import { ToggleService } from '../../../services/toggle/toggle.service';

@Component({
  selector: 'app-add-capture-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule],
  templateUrl: './add-capture-dialog.component.html',
  styleUrl: './add-capture-dialog.component.scss'
})
export class AddCaptureDialogComponent {

  tool: any = { type: 'pen', color: 'black', width: 1 }
  zoomScale: number = 1;
  dataURL: any;
  blob: any;
  img_width: number = 0;
  img_height: number = 0;

  toggle_video_whiteboard: string = '';

  constructor(
    private toolService: ToolService,
    private canvasService: CanvasService,
    private zone: NgZone,
    private stackImageService: StackImageService,
    public dialogRef: MatDialogRef<AddCaptureDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toggleService: ToggleService
  ) {
    effect(() => {
      this.toggle_video_whiteboard = this.toggleService.toggle_video_whiteboard();
    })
  }

  ngOnInit() {
    this.getCapturedImage();

  }
  observer: any;
  observer_target: any;
  ngAfterViewInit() {
    this.observer = new ResizeObserver(entries => {
      this.zone.run(() => {
        setTimeout(() => {

          // document 모드인지, video 모드인지 구분 필요
          const video_target: any = document.getElementById('capturedImage');


          this.imageResize(video_target)
        }, 0); // 렌더링 후에 실행되도록 설정
      });
    });

    this.observer_target = document.getElementsByClassName('present_container')[0]

    this.observer.observe(this.observer_target);
  }

  ngOnDestroy() {
    if (this.observer && this.observer_target) {
      this.observer.unobserve(this.observer_target); // 관찰 중지
      this.observer.disconnect(); // observer 해제
    }
  }
  /**
   * 현재 비디오 이미지로 캡쳐
   */
  getCapturedImage() {
    let e: any;

    if (this.toggleService.toggle_video_whiteboard() == 'video') {
      e = document.getElementById('present_video')
    } else {
      e = document.getElementsByClassName('video')[0]

    }


    // 현재 화면 크기
    const screenWidth = window.innerWidth;
    const maxCanvasWidth = 1000; // 최대 너비 제한
    let canvasWidth = Math.min(screenWidth * 0.9, maxCanvasWidth); // 화면 90% 또는 1200px 중 작은 값

    // 비디오 비율 계산
    const videoWidth = e.videoWidth || e.clientWidth; // 비디오의 원래 너비
    const videoHeight = e.videoHeight || e.clientHeight; // 비디오의 원래 높이
    const aspectRatio = videoWidth / videoHeight;


    // 높이 계산 (비율 유지)
    const canvasHeight = canvasWidth / aspectRatio;


    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    canvas.getContext('2d')?.drawImage(e, 0, 0, canvas.width, canvas.height);
    this.blob = this.base64ToBlob(canvas.toDataURL('image/png'), 'image/png');
    this.dataURL = URL.createObjectURL(this.blob);
    this.setCanvas()
  }


  base64ToBlob(base64: any, contentType = '', sliceSize = 512) {
    base64 = base64.split(',')[1];

    const byteCharacters = atob(base64); // Base64를 디코딩하여 이진 데이터로 변환
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }

  imageResize(target_image: any) {

    const data_canvas: any = document.getElementById('add_data_canvas');
    const drawing_canvas: any = document.getElementById('add_drawing_canvas');
    const canvas_section: any = document.getElementById('canvas_section');


    this.img_width = target_image.width;
    this.img_height = target_image.height;

    data_canvas.width = target_image.width;
    drawing_canvas.width = target_image.width;
    data_canvas.height = target_image.height;
    drawing_canvas.height = target_image.height;

    // canvas_section.style.width = target_image.width + "px";
    // canvas_section.style.height = target_image.height + "px";
  }

  /**
     * 타입 지정 함수
     * @param type 지정할 타입
     */
  setType(type: string) {
    this.tool.type = type;
    this.setCanvas()
  }

  /**
   * 색 지정 함수
   * @param color 색
   */
  setColor(color: string) {
    this.tool.color = color;
    this.setCanvas()
  }

  /**
   * 팬 두께 지정
   * @param width 두께
   */
  setWidth(width: number) {
    this.tool.width = width;
    this.setCanvas()
  }


  /**
   * 캔버스 세팅
   */
  setCanvas() {
    const data_canvas: any = document.getElementById('add_data_canvas');
    const drawing_canvas: any = document.getElementById('add_drawing_canvas');
    this.canvasService.addCaptureEventHandler(drawing_canvas, data_canvas, this.tool, this.zoomScale)
  }


  /**
   * 전체 지우기
   */
  clearDrawing() {
    if (window.confirm('Do you want to delete all drawings on the current page?')) {

      const video_target: any = document.getElementById('add_data_canvas');
      const target_context: any = video_target.getContext('2d');
      target_context.clearRect(0, 0, video_target.width, video_target.height);
      this.stackImageService.drawingStack.set([]);
    }
  }

  /**
   * 모달 닫기
   */
  closeModal() {
    this.dialogRef.close()
  }


  /**
   * 모달 닫기 및 chat에 데이터 전달
   */
  save() {
    const data = {
      width: this.img_width,
      height: this.img_height,
      dataURL: this.dataURL,
      blob: this.blob,
      drawingDatas: this.stackImageService.drawingStack()
    }
    this.stackImageService.drawingStack.set([]);
    this.dialogRef.close(data);
  }
}
