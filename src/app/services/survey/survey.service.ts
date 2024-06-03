import { Injectable, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AddSurveyComponent } from '../../components/dialogs/survey/add-survey/add-survey.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';


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




}
