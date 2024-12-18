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
		const CMAP_URL = "/assets/lib/pdf/cmaps/";
		const CMAP_PACKED = true;
		const pdfPages = [];

		try {
			// new version
			const pdfDoc = await pdfjsLib.getDocument({
				data: file,
				cMapUrl: CMAP_URL,
				cMapPacked: CMAP_PACKED,
			}).promise;

			for (let i = 0; i < pdfDoc.numPages; i++) {
				pdfPages[i] = await pdfDoc.getPage(i + 1);
			}
			// destroy를 위해 pdfDoc도 반환.
			return {
				pdfPages: pdfPages,
				pdfDoc: pdfDoc, // for destroy
			};
		} catch (err) {
			console.log(err);
			alert("오류가 발생하였습니다 : " + err);
			return {
				success: false,
			};
		}
	}
}
