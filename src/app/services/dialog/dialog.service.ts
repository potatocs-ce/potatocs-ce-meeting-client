import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../components/dialogs/confirm-dialog/confirm-dialog.component';
import { PositiveDialogComponent } from '../../components/dialogs/positive-dialog/positive-dialog.component';
import { NegativeDialogComponent } from '../../components/dialogs/negative-dialog/negative-dialog.component';
import { GroupDialogComponent } from '../../components/dialogs/mobile/group-dialog/group-dialog.component';
import { ChatDialogComponent } from '../../components/dialogs/mobile/chat-dialog/chat-dialog.component';
import { SurveyDialogComponent } from '../../components/dialogs/mobile/survey-dialog/survey-dialog.component';
import { AddCaptureDialogComponent } from '../../components/dialogs/add-capture-dialog/add-capture-dialog.component';
import { CaptureDialogComponent } from '../../components/dialogs/capture-dialog/capture-dialog.component';

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



  // 모바일용 현재 참여자 목록 불러오는 함수 다이어로그
  openMobileGroupDialog() {
    const dialogRef = this.dialog.open(GroupDialogComponent);
    return dialogRef.afterClosed();
  }

  // 모바일용 채팅 정보 불러오는 다이어로그
  openMobileChatDialog() {
    const dialogRef = this.dialog.open(ChatDialogComponent);
    return dialogRef.afterClosed();
  }
  // 모바일용 투표 정보 불러오는 다이어로그
  openMobileSurveyDialog() {
    const dialogRef = this.dialog.open(SurveyDialogComponent);
    return dialogRef.afterClosed();
  }









  // 캡쳐 추가용 다이어로그
  openCaptureDialog() {
    const dialogRef = this.dialog.open(AddCaptureDialogComponent);
    return dialogRef.afterClosed();
  }

  openCapturedDialog(data: any) {
    const dialogRef = this.dialog.open(CaptureDialogComponent, {
      data
    });
    return dialogRef.afterClosed();
  }
}