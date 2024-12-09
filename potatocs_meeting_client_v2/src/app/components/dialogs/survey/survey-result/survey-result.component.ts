import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { SurveyApiService } from '../../../../api/survey/survey-api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../../public/card/card.component';
import { BaseChartDirective } from 'ng2-charts';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-survey-result',
  standalone: true,
  imports: [CommonModule, CardComponent, BaseChartDirective, MatProgressSpinnerModule],
  templateUrl: './survey-result.component.html',
  styleUrl: './survey-result.component.scss',

})
export class SurveyResultComponent {


  survey: any = {};
  result: any = {};
  organized_result: any = {};
  chart_data: any = [];
  my_data: any = [];

  loading: boolean = true;

  constructor(private surveyService: SurveyApiService,
    private route: ActivatedRoute,
    private router: Router,
    public dialogRef: MatDialogRef<SurveyResultComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }


  chartOptions: any = {
    indexAxis: 'y',
    backgroundColor: 'rgba(0, 21, 79, 255)',
    responsive: true,
    maintainAspectRatio: false
  }



  ngOnInit() {

    this.surveyService.getSurvey(this.data._id).subscribe((res: any) => {
      this.survey = res;

      this.survey.cards.map((card: any) => {
        const data: any = { labels: [], index: [], data: [] };
        card.item_options.map((option: any) => {
          data.labels.push(option.option);
          data.index.push(option.index);
          data.data.push(0);
        })
        this.organized_result[`${card.index}`] = data;

      })
      this.surveyService.getSurveyResult(res._id).subscribe((res: any) => {
        this.result = res;

        this.result.map((r: any) => {
          const entries = Object.entries(r.result);
          entries.map((r2: any) => {
            r2[1].map((r3: any) => {
              const result = this.organized_result[`${r2[0]}`]
              result.data[result.index.indexOf(r3)]++;
            })
          })
        })
        let test: any = [];
        const values: any = Object.values(this.organized_result);
        values.map((result: any) => {
          test.push({
            labels: result.labels,
            datasets: [{
              data: result.data,
            }],
          })
        })

        this.my_data = test;
        this.loading = false;
      })
    })

  }


  setData(index: number) {

    const result = this.organized_result[index]

    return {
      labels: result.labels,
      datasets: [{
        data: result.data,
      }],

    }
  }



}
