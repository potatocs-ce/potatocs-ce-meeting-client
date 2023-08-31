import { Component, OnInit } from '@angular/core';

import { ZoomService } from 'src/@wb/services/zoom/zoom.service'

import { ViewInfoService } from 'src/@wb/store/view-info.service';


@Component({
  selector: 'app-board-fabs',
  templateUrl: './board-fabs.component.html',
  styleUrls: ['./board-fabs.component.scss']
})
export class BoardFabsComponent implements OnInit {

  constructor(
    private viewInfoService: ViewInfoService,
    private zoomService: ZoomService

  ) { }

  ngOnInit(): void {
    this.viewInfoService.state$
      .pipe(takeUntil(this.unsubscribe$), pluck('documentInfo'), distinctUntilChanged())
      .subscribe(async (documentInfo) => {
        this.documentInfo = documentInfo;
        console.log(this.documentInfo)
        await new Promise(res => setTimeout(res, 0));

        this.renderFileList();
      });

  }


  /**
   * Zoom Button에 대한 동작
   * - viewInfoService의 zoomScale 값 update
   *
   * @param action : 'fitToWidth' , 'fitToPage', 'zoomIn', 'zoomOut'
   */
  clickZoom(action: any) {
    console.log(">> Click Zoom: ", action);

    const docNum = this.viewInfoService.state.pageInfo.currentDocNum;
    const currentPage = this.viewInfoService.state.pageInfo.currentPage;
    const prevZoomScale = this.viewInfoService.state.pageInfo.zoomScale;

    const newZoomScale = this.zoomService.calcZoomScale(action, docNum, currentPage, prevZoomScale);

    this.viewInfoService.updateZoomScale(newZoomScale);

  }

}
