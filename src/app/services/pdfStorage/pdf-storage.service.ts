import { Injectable } from "@angular/core";

@Injectable({
	providedIn: "root",
})
export class PdfStorageService {
	constructor() {}

	getPdfPage(pdfNum: any, pageNum: any) {
		// return this._pdfVarArray[pdfNum - 1]?.pdfPages[pageNum - 1];
	}
}
