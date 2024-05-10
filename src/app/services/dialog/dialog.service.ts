import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../components/dialogs/confirm-dialog/confirm-dialog.component';
import { PositiveDialogComponent } from '../../components/dialogs/positive-dialog/positive-dialog.component';
import { NegativeDialogComponent } from '../../components/dialogs/negative-dialog/negative-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class DialogService {

  public dialog = inject(MatDialog);

  constructor() { }
  openDialogConfirm(data: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        content: data,
      },
    });

    return dialogRef.afterClosed();
  }
  openDialogPositive(data: string) {
    const dialogRef = this.dialog.open(PositiveDialogComponent, {
      data: {
        content: data,
      },
    });

    return dialogRef.afterClosed();
  }
  openDialogNegative(data: string) {
    const dialogRef = this.dialog.open(NegativeDialogComponent, {
      data: {
        content: data,
      },
    });

    return dialogRef.afterClosed();
  }
}