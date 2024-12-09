import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DrawingService } from '../../../services/drawing/drawing.service';

@Component({
  selector: 'app-capture-dialog',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDialogModule],
  templateUrl: './capture-dialog.component.html',
  styleUrl: './capture-dialog.component.scss'
})
export class CaptureDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<CaptureDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private drawingService: DrawingService) {


  }

  ngAfterViewInit() {
    const dialog_content: any = document.getElementById('dialog_content');

    const img = document.createElement('img');
    img.src = this.data.blob;

    // canvas 생성
    const canvas: any = document.createElement('canvas');
    canvas.width = this.data.width;
    canvas.height = this.data.height;

    // getContext 
    const context: any = canvas.getContext('2d');
    context.setTransform(1, 0, 0, 1, 0, 0)
    this.data.drawingDatas?.forEach((data: any) => {
      this.drawingService.end(context, data.points, data.tool)
    })
    img.style.position = 'absolute';
    canvas.style.position = 'absolute';
    dialog_content.style.width = this.data.width + 'px';
    dialog_content.style.height = this.data.height + 'px';
    dialog_content?.appendChild(img);
    dialog_content?.appendChild(canvas);


  }
  closeDialog() {
    this.dialogRef.close()
  }


  downloadImg() {
    const img = document.createElement('img');
    img.src = this.data.blob;
    img.onload = () => {
      const tempCanvas: any = document.createElement('canvas');
      const ctx: any = tempCanvas.getContext('2d');
      tempCanvas.width = this.data.width;
      tempCanvas.height = this.data.height;


      // 이미지 그리기
      ctx.drawImage(img, 0, 0);

      this.data.drawingDatas?.forEach((data: any) => {
        this.drawingService.end(ctx, data.points, data.tool)
      })

      // 캔버스를 PNG 이미지로 변환하여 다운로드
      const link = document.createElement('a');
      link.download = 'captured-image.png';
      link.href = tempCanvas.toDataURL('image/png');
      link.click();
    }

  }
}
