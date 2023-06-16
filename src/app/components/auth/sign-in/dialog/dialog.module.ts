import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DialogComponent } from './dialog.component';
import { ConfirmDialogComponent } from './dialog.component';
import { PositiveDialogComponent } from './dialog.component';
import { NegativeDialogComponent } from './dialog.component';
import { SpinnerDialogComponent } from './dialog.component';

import { NgMaterialUIModule } from 'src/app/ng-material-ui/ng-material-ui.module';


@NgModule({
  declarations: [
    DialogComponent,
    ConfirmDialogComponent,
    PositiveDialogComponent,
    NegativeDialogComponent,
    SpinnerDialogComponent
  ],
  imports: [
    CommonModule,
    NgMaterialUIModule
  ],
  entryComponents: [
    ConfirmDialogComponent,
    PositiveDialogComponent,
    NegativeDialogComponent
  ]
})

export class DialogModule { }
