import { Injectable, signal } from '@angular/core';

/**
 * 스크린 샷을 찍어 놓은 데이터를 임시
 */
@Injectable({
  providedIn: 'root'
})
export class StackImageService {

  constructor() { }
  // 이미지 임시 저장
  imageStack = signal<Array<any>>([]);

  // 판서 정보 임시 저장
  drawingStack = signal<Array<any>>([]);

  /**
   * 스택 가져오기
   */
  getStack = async () => {

  }

  /**
   * 스택에 값 추가
   */
  setStack = async () => {

  }
}
