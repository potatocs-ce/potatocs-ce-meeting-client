import { Injectable, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AddSurveyComponent } from '../../components/dialogs/survey/add-survey/add-survey.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { SurveyComponent } from '../../components/dialogs/survey/survey/survey.component';
import { SurveyResultComponent } from '../../components/dialogs/survey/survey-result/survey-result.component';
import { EditSurveyComponent } from '../../components/dialogs/survey/edit-survey/edit-survey.component';


@Injectable({
  providedIn: 'root'
})
export class SurveyService {

  surveys = signal<any>([]);

  public dialog = inject(MatDialog);

  openAddSurveyDialog() {
    const dialogRef = this.dialog.open(AddSurveyComponent, {
      'maxHeight': '100vh'
    })

    return dialogRef.afterClosed();
  }


  openSurveyDialog(_id: string) {
    const dialogRef = this.dialog.open(SurveyComponent, {
      data: {
        _id
      },
      autoFocus: false
    })
    return dialogRef.afterClosed();
  }

  openSurveyResultDialog(_id: string) {
    const dialogRef = this.dialog.open(SurveyResultComponent, {
      data: {
        _id
      },
      autoFocus: false
    })
    return dialogRef.afterClosed();
  }


  openEditSurveyDialog(_id: string) {
    const dialogRef = this.dialog.open(EditSurveyComponent, {
      data: {
        _id
      },
      autoFocus: false
    })

    return dialogRef.afterClosed();
  }
}
