import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SurveyService } from '../../services/survey/survey.service';

@Component({
  selector: 'app-survey',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './survey.component.html',
  styleUrl: './survey.component.scss'
})
export class SurveyComponent {
  constructor(private survayService: SurveyService) {

  }
  addSurvey() {
    this.survayService.openAddSurveyDialog().subscribe((result: any) => {

    })
  }
}
