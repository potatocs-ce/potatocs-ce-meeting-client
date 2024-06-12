import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { CardComponent } from '../../../public/card/card.component';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { SurveyService } from '../../../../services/survey/survey.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MeetingService } from '../../../../services/meeting/meeting.service';
import { SurveyApiService } from '../../../../api/survey/survey-api.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SurveySocketService } from '../../../../services/socket/survey/survey-socket.service';
import { DialogService } from '../../../../services/dialog/dialog.service';

@Component({
  selector: 'app-add-survey',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    FormsModule,
    CdkDropList,
    CdkDrag,
    MatSlideToggleModule,
    MatSliderModule,
    DragDropModule
  ],
  templateUrl: './add-survey.component.html',
  styleUrl: './add-survey.component.scss'
})
export class AddSurveyComponent {
  //제목
  title: string = '';

  // 설명
  description: string = '';


  // card 초기화
  cards: any[] = [{
    index: 1, item_title: '', num_of_answer: 1, item_options: [{ index: 1, option: 'option 1' }], required: false
  }];



  constructor(
    private surveyApiService: SurveyApiService,
    private router: Router,
    private meetingService: MeetingService,
    public dialogRef: MatDialogRef<AddSurveyComponent>,
    private surveyService: SurveyService,
    private surveySocketService: SurveySocketService,
    private dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) public data: any) {

  }

  // 카드 추가 
  addCard() {
    let next_index = 0;
    this.cards.map((card) => { next_index < card.index ? next_index = card.index : '' })
    this.cards.push({
      index: next_index + 1, item_title: '', num_of_answer: 1, item_options: [{ index: 1, option: 'option 1' }], required: false
    })
  }

  // 카드 삭제
  removeCard(idx: number) {
    this.cards.splice(idx, 1);
  }

  // 항목 추가
  addItem(idx: number) {
    let next_index = 0
    this.cards[idx].item_options.map((item: any) => { next_index < item.index ? next_index = item.index : '' })
    this.cards[idx].item_options.push({ index: next_index + 1, option: `option ${next_index + 1}` })
  }


  // 항목 삭제
  removeItem(idx: number, item_idx: number) {
    this.cards[idx].item_options.splice(item_idx, 1)
  }


  // card drop
  cardDrop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.cards, event.previousIndex, event.currentIndex);
  }


  itemDrop(event: CdkDragDrop<string[]>, idx: number) {
    moveItemInArray(this.cards[idx].item_options, event.previousIndex, event.currentIndex);
  }

  // 제출
  submit() {
    // console.log({ title: this.title, description: this.description, cards: this.cards })
    this.surveyApiService.addSurvey({ title: this.title, description: this.description, cards: this.cards, meetingId: this.meetingService.meeting_room_id() }).subscribe((res: any) => {
      if (res.status) {
        this.dialogService.openDialogPositive('Success to add a survey')
        // 다른 사람들에게 리스트 업데이트 알림
        this.surveySocketService.updateSurvey();
        this.onNoClick();
      } else {
        this.dialogService.openDialogNegative('Failed to add a survey...')
      }
    })
  }

  // 다이어로그 끄기 함수
  onNoClick(): void {
    this.dialogRef.close();
  }
}
