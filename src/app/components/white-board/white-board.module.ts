import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Module
// import { MaterialModule } from 'src/app/material/material.module';
// Component
import { WhiteBoardComponent } from './white-board.component';
import { BoardNavComponent } from './board-nav/board-nav.component';
import { BoardSlideViewComponent } from './board-slide-view/board-slide-view.component';
import { BoardFileViewComponent } from './board-file-view/board-file-view.component';
import { BoardFabsComponent } from './board-fabs/board-fabs.component';

// Canvas comp
import { BoardCanvasComponent } from './board-canvas/board-canvas.component';
import { NgMaterialUIModule } from 'src/app/ng-material-ui/ng-material-ui.module';
import { IconModule } from '@visurel/iconify-angular';

// import { DragScrollDirective } from 'src/app/services/directives/drag-scroll.directive';



@NgModule({
	declarations: [
		WhiteBoardComponent,
		BoardNavComponent,
		BoardSlideViewComponent,
        BoardFileViewComponent,
		BoardCanvasComponent,
  	    BoardFabsComponent,
    	// DragScrollDirective,

	],
	imports: [
		CommonModule,
		NgMaterialUIModule,
		FormsModule,
		IconModule
	],
	entryComponents: [
	]
})
export class WhiteBoardModule { }
