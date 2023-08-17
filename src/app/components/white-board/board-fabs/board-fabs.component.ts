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
    //now side info
    this.viewInfoService.state$
      .pipe(takeUntil(this.unsubscribe$), distinctUntilChanged(), pairwise())
      .subscribe(([prevViewInfo, viewInfo]) => {

        console.log(prevViewInfo.leftSideView)

        // 현재 sideBar doc. view 정보 받아서 저장.
        this.prevViewInfo = prevViewInfo.leftSideView


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
