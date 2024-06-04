import { CommonModule } from '@angular/common';
import { Component, effect } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SurveyService } from '../../services/survey/survey.service';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-survey',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './survey.component.html',
  styleUrl: './survey.component.scss'
})
export class SurveyComponent {
  surveys: any;
  user_id: string = '';
  constructor(public survayService: SurveyService, private authService: AuthService) {
    effect(() => {
      this.surveys = this.survayService.surveys();

    })

    this.user_id = authService.getTokenInfo()._id
  }
  addSurvey() {
    this.survayService.openAddSurveyDialog().subscribe((result: any) => {

    })
  }


  startSurvey(_id: string, participant: boolean) {
    if (participant) {
      this.survayService.openSurveyResultDialog(_id).subscribe((result: any) => {

      })
    } else {
      this.survayService.openSurveyDialog(_id).subscribe((result: any) => {

      })
    }
  }


  editSurvey(_id: string) {
    this.survayService.openEditSurveyDialog(_id).subscribe((result: any) => {

    })
  }


  removeSurvey(_id: string) {

  }
}
