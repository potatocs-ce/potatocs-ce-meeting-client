import { Injectable, signal } from "@angular/core";
import { CANVAS_CONFIG } from "../../../config/config"; // 캔버스 관련 설정 불러오기
import { DocumentService } from "../document/document.service"; // 문서 서비스 불러오기

@Injectable({
	providedIn: "root", // 서비스가 애플리케이션 전역에서 사용되도록 등록
})
export class ZoomService {
	// 현재 확대 비율을 저장하는 상태 변수
	zoomScale: any = signal<number>(1); // 기본 값은 1 (100%)

	// 최대 및 최소 확대 비율
	maxZoomScale = CANVAS_CONFIG.maxZoomScale;
	minZoomScale = CANVAS_CONFIG.minZoomScale;

	constructor(private docService: DocumentService) {}

	/**
	 * 확대/축소 비율 계산
	 * @param {string} zoomInfo - 확대/축소 옵션 (e.g., 'zoomIn', 'zoomOut', 'fitToWidth', 'fitToPage')
	 * @param {number} docNum - 현재 문서 번호
	 * @param {number} pageNum - 현재 페이지 번호
	 * @param {number} prevZoomScale - 이전 확대 비율 (기본값: 1)
	 * @returns {number} - 계산된 확대 비율
	 */
	calcZoomScale(zoomInfo: string, docNum: number, pageNum: number, prevZoomScale = 1): number {
		let zoomScale = 1; // 기본 확대 비율

		switch (zoomInfo) {
			case "zoomIn":
				// 확대 (이전 비율에서 +1 단계)
				zoomScale = this.calcNewZoomScale(prevZoomScale, +1);
				break;

			case "zoomOut":
				// 축소 (이전 비율에서 -1 단계)
				zoomScale = this.calcNewZoomScale(prevZoomScale, -1);
				break;

			case "fitToWidth":
				// 페이지를 폭에 맞춤
				zoomScale = this.fitToWidth(docNum, pageNum);
				break;

			case "fitToPage":
				// 페이지 전체를 화면에 맞춤
				zoomScale = this.fitToPage(docNum, pageNum);
				break;
		}

		return zoomScale;
	}

	/**
	 * 새로운 확대 비율 계산
	 * @param {number} currentScale - 현재 확대 비율
	 * @param {number} sgn - 단계 방향 (+1: 확대, -1: 축소)
	 * @returns {number} - 새로 계산된 확대 비율
	 */
	calcNewZoomScale(currentScale: number, sgn: number): number {
		let step; // 확대/축소 단계

		// 현재 비율을 0.1 단위로 정리
		const prevScale = Math.floor(currentScale * 10) / 10;

		// 확대/축소 단계 설정
		if (sgn > 0) {
			// 확대
			if (prevScale < 1.1) step = 0.1;
			else if (prevScale < 2) step = 0.2;
			else step = 0.3;
		} else {
			// 축소
			if (prevScale <= 1.1) step = 0.1;
			else if (prevScale <= 2.1) step = 0.2;
			else step = 0.3;
		}

		// 새로운 비율 계산
		let newScale = Math.round((prevScale + step * sgn) * 10) / 10;

		// 최대/최소 비율로 제한
		newScale = Math.min(newScale, this.maxZoomScale);
		newScale = Math.max(newScale, this.minZoomScale);

		console.log("new Scale:", newScale); // 디버깅용 로그

		return newScale;
	}

	/**
	 * 페이지를 폭에 맞춤
	 * @param {any} currentDoc - 현재 문서 객체
	 * @param {number} currentPage - 현재 페이지 번호
	 * @returns {number} - 폭에 맞춘 확대 비율
	 */
	fitToWidth(currentDoc: any, currentPage: number): number {
		// 컨테이너 크기 설정
		const containerSize = {
			width: CANVAS_CONFIG.maxContainerWidth, // 캔버스 최대 폭
			height: CANVAS_CONFIG.maxContainerHeight, // 캔버스 최대 높이
		};

		// PDF 페이지 정보 가져오기
		const pdfPage: any = this.docService.getPdfPage(currentDoc + 1, currentPage);
		const docSize = pdfPage.getViewport({ scale: 1 * CANVAS_CONFIG.CSS_UNIT }); // 100% 크기 기준

		// 확대 비율 계산 (컨테이너 폭 / 문서 폭)
		const zoomScale = containerSize.width / docSize.width;

		return zoomScale;
	}

	/**
	 * 페이지를 화면에 맞춤
	 * @param {any} currentDoc - 현재 문서 객체
	 * @param {number} currentPage - 현재 페이지 번호
	 * @returns {number} - 화면에 맞춘 확대 비율
	 */
	fitToPage(currentDoc: any, currentPage: number): number {
		// 컨테이너 크기 설정
		const containerSize = {
			width: CANVAS_CONFIG.maxContainerWidth,
			height: CANVAS_CONFIG.maxContainerHeight,
		};

		// PDF 페이지 정보 가져오기
		const pdfPage: any = this.docService.getPdfPage(currentDoc + 1, currentPage);
		const docSize = pdfPage.getViewport({ scale: 1 * CANVAS_CONFIG.CSS_UNIT }); // 100% 크기 기준

		// 가로와 세로 비율 계산
		const ratio = {
			w: containerSize.width / docSize.width,
			h: containerSize.height / docSize.height,
		};

		// 화면에 맞추기 위해 최소 비율 선택
		const zoomScale = Math.min(ratio.h, ratio.w);

		return zoomScale;
	}
}
