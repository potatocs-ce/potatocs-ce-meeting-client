import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CardComponent } from '../../../public/card/card.component';
import { MatIconModule } from '@angular/material/icon';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { SurveyService } from '../../../../services/survey/survey.service';
import { SurveyApiService } from '../../../../api/survey/survey-api.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-survey',
  standalone: true,
  imports: [RouterModule, CommonModule, CardComponent, MatIconModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatButtonModule, FormsModule,],
  templateUrl: './survey.component.html',
  styleUrl: './survey.component.scss'
})
export class SurveyComponent {
  survey_id: string = '';
  survey: any = {};
  result: any = {};

  constructor(private surveyService: SurveyApiService, private route: ActivatedRoute, private router: Router, public dialogRef: MatDialogRef<SurveyComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {

    this.surveyService.getSurvey(this.data._id).subscribe((res: any) => {
      this.survey = res;
      this.survey.cards.map((card: any) => {
        this.result[`${card.index}`] = [];
      })

    })
  }

  updateResult(card_index: string, option_index: string, e: any) {
    if (e.checked) {
      this.result[`${card_index}`].push(option_index)
    } else {
      this.result[`${card_index}`] = this.result[`${card_index}`].filter((card: any) => card != option_index)
    }

    // console.log(this.result)
  }



  submit() {
    for (let card of this.survey.cards) {
      if (card.required && this.result[card.index].length == 0) {
        window.alert('필수 항목 미입력: ' + card.item_title)
        return;
      }
    }
    console.log(this.data._id, this.result)
    this.surveyService.survey(this.data._id, this.result).subscribe((res: any) => {
      if (res.status) {
        window.alert("응답이 기록되었습니다.")
        // this.router.navigate(['/'])
      }
    })
  }

  back() {
    // this.router.navigate(['/'])
  }

}
