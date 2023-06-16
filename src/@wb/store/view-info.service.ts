import { Injectable } from '@angular/core';
import { Store } from './store';


class InitViewInfo {
  leftSideView = 'fileList'; //'fileList', 'thumbnail';
  documentInfo = []; // {_id: '',  currentPage: 1,  numPages: 1}
  pageInfo = {
    currentDocId : '',
    currentDocNum: 1,
    currentPage : 1,
    zoomScale : 1
  }
}


@Injectable({
  providedIn: 'root'
})

export class ViewInfoService extends Store<any> {

  constructor() {
    super(new InitViewInfo());
  }

  setViewInfo(data: any): void {
    this.setState({
      ...this.state, ...data
    });
  }


  /**
   * 페이지 변경에 따른 Data Update
   *
   * @param pageNum 페이지 번호
   */
   updateCurrentPageNum(pageNum: any): void {

    // documentInfo Array는 값만 update(no triggering)
    const currentDocNum = this.state.pageInfo.currentDocNum;

    this.state.documentInfo[currentDocNum-1].currentPage = pageNum;


    // pageInfo는 object 전체 변경 -> trigger
    const pageInfo = Object.assign({}, this.state.pageInfo);
    pageInfo.currentPage = pageNum;
    this.setState({
      ...this.state, pageInfo: pageInfo
    })
  }

  /**
   * file view -> thumbnail view
   * - Current Document update
   *
   * @param docId: document ID
   */
   changeToThumbnailView(docId: any): void {

    const pageInfo = Object.assign({}, this.state.pageInfo);

    pageInfo.currentDocId = docId;
    pageInfo.currentDocNum =  this.state.documentInfo.findIndex((item) => item._id == docId) + 1;
    pageInfo.currentPage = this.state.documentInfo.find((item) => item._id === docId)?.currentPage || 1;

    const obj: any = {
      leftSideView: 'thumbnail',
      pageInfo: pageInfo
    }

    // viewInfo에 값을 넣으면 board canvas에서 subscription해서 그림
    this.setState({
      ...this.state, ...obj
    })
  }

  /**
   * Update Zoom Scale
   * @param
   * @param Zoom
   */
  updateZoomScale(newZoomScale): void {
    const pageInfo = Object.assign({}, this.state.pageInfo);
    pageInfo.zoomScale = newZoomScale;
    this.setState({
      ...this.state, pageInfo: pageInfo
    })
  }

}
