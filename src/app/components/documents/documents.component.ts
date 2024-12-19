import { CommonModule } from "@angular/common";
import { Component, effect } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { DocListComponent } from "./doc-list/doc-list.component";
import { DocumentService } from "../../services/document/document.service";
import { DocPageComponent } from "./doc-page/doc-page.component";

@Component({
	selector: "app-documents",
	standalone: true,
	imports: [CommonModule, MatButtonModule, MatIconModule, DocListComponent, DocPageComponent],
	templateUrl: "./documents.component.html",
	styleUrl: "./documents.component.scss",
})
export class DocumentsComponent {
	doc: any = [];

	constructor(private docService: DocumentService) {
		effect(() => {
			this.doc = this.docService._doc();
		});
	}
}
