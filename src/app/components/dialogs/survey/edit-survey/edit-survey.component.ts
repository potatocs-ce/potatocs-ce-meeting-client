import { Component, Inject } from '@angular/core';
import { SurveyApiService } from '../../../../api/survey/survey-api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CdkDrag, CdkDragDrop, CdkDropList, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CardComponent } from '../../../public/card/card.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-edit-survey',
  standalone: true,
  imports: [CommonModule,
    CardComponent,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    FormsModule,
    CdkDropList,
    CdkDrag,
    MatSlideToggleModule,
    MatSliderModule,
    DragDropModule],
  templateUrl: './edit-survey.component.html',
  styleUrl: './edit-survey.component.scss'
})
export class EditSurveyComponent {
  survey_id: string = '';
  //제목
  title: string = '';

  // 설명
  description: string = '';


  // card 초기화
  cards: any[] = [{
    index: 1, item_title: '', num_of_answer: 1, item_options: [{ index: 1, option: 'option 1' }], required: false
  }];



  constructor(
    private surveyService: SurveyApiService,
    private route: ActivatedRoute,
    private router: Router,
    public dialogRef: MatDialogRef<EditSurveyComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {



    this.surveyService.getSurvey(this.data._id).subscribe((res: any) => {
      console.log(res)
      this.title = res.title;
      this.description = res.description;
      this.cards = res.cards;
      // this.survey = res;
      // this.survey.cards.map((card: any) => {
      //   this.result[`${card.index}`] = [];
      // })
    })

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
    console.log(this.title, this.description, this.cards)
    this.surveyService.editSurvey(this.data._id, { title: this.title, description: this.description, cards: this.cards }).subscribe((res: any) => {
      if (res.status) {
        window.alert('설문지가 수정되었습니다.')
        // this.router.navigate(['/'])
      }
    })
  }
}
