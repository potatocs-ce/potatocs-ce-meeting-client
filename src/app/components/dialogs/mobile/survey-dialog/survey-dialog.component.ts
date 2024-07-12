import { CommonModule } from '@angular/common';
import { Component, effect } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SurveyService } from '../../../../services/survey/survey.service';
import { AuthService } from '../../../../services/auth/auth.service';
import { SurveyApiService } from '../../../../api/survey/survey-api.service';
import { DialogService } from '../../../../services/dialog/dialog.service';
import { SurveySocketService } from '../../../../services/socket/survey/survey-socket.service';

@Component({
  selector: 'app-survey-dialog',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './survey-dialog.component.html',
  styleUrl: './survey-dialog.component.scss'
})
export class SurveyDialogComponent {
  surveys: any;
  user_id: string = '';
  constructor(
    public survayService: SurveyService,
    private authService: AuthService,
    private surveyApiService: SurveyApiService,
    private dialogService: DialogService,
    private surveySocketService: SurveySocketService) {
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
    this.surveyApiService.deleteSurvey(_id).subscribe((result: any) => {
      if (result.status) {
        this.dialogService.openDialogPositive('Success to remove a survey')
        this.surveySocketService.updateSurvey();
      } else {
        this.dialogService.openDialogPositive('Failed to remove a survey')
      }
    })
  }
}
