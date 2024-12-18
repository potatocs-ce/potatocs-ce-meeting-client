import { Injectable } from "@angular/core";
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = "./assets/lib/pdf/pdf.worker.js";
@Injectable({
	providedIn: "root",
})
export class FileService {
	constructor() {}

	readFile(file: any) {
		// FileReader 객체 생성: 파일을 읽기 위해 FileReader를 사용합니다.
		const fileReader = new FileReader();

		// Promise 객체를 반환: 비동기적으로 파일을 읽고 결과를 처리하기 위해 Promise를 사용합니다.
		return new Promise(function (resolve, reject) {
			// 파일 읽기가 완료되었을 때 호출되는 이벤트 핸들러
			fileReader.onload = function (e) {
				// 읽은 파일 데이터 (ArrayBuffer 형식)를 Promise의 resolve로 전달
				resolve((<FileReader>e.target).result);
			};

			// 파일을 ArrayBuffer 형식으로 읽기 시작
			fileReader.readAsArrayBuffer(file);
		});
	}

	async pdfConvert(file: any) {
		// PDF.js에서 사용할 CMap URL과 관련 설정
		const CMAP_URL = "/assets/lib/pdf/cmaps/";
		const CMAP_PACKED = true; // CMap 파일이 압축되었는지 여부
		const pdfPages = []; // 페이지 데이터를 저장할 배열

		try {
			// PDF 문서를 비동기적으로 로드
			const pdfDoc = await pdfjsLib.getDocument({
				data: file, // 파일 데이터
				cMapUrl: CMAP_URL, // CMap 파일 경로
				cMapPacked: CMAP_PACKED, // CMap 압축 여부
			}).promise;

			// PDF의 각 페이지 데이터를 비동기적으로 가져오기
			for (let i = 0; i < pdfDoc.numPages; i++) {
				// 페이지 번호는 1부터 시작하므로 i + 1 사용
				pdfPages[i] = await pdfDoc.getPage(i + 1);
			}

			// 반환값: 페이지 데이터와 PDF 문서 객체를 반환
			// pdfDoc을 반환하여 이후 destroy를 호출할 수 있도록 제공
			return {
				pdfPages: pdfPages, // 읽어온 PDF 페이지 데이터
				pdfDoc: pdfDoc, // PDF 문서 객체 (cleanup을 위해 반환)
			};
		} catch (err) {
			// 오류 처리: 콘솔에 에러를 출력하고 사용자에게 경고 표시
			console.log(err);
			alert("오류가 발생하였습니다 : " + err);

			// 오류 발생 시 실패 상태를 반환
			return {
				success: false, // 성공 여부를 false로 설정
			};
		}
	}
}
