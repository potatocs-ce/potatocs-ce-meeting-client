import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
@Component({
  selector: 'app-positive-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './positive-dialog.component.html',
  styleUrl: './positive-dialog.component.scss'
})
export class PositiveDialogComponent {
  flag: boolean | undefined;

  constructor(public dialogRef: MatDialogRef<PositiveDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
    this.data.flag = true;
  }

  closeModal() {
    this.data.flag = false;
    this.dialogRef.close()
  }
}
