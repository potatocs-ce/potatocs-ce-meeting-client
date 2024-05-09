import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DocListComponent } from './doc-list/doc-list.component';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, DocListComponent],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.scss'
})
export class DocumentsComponent {
  temp_doc_list = [1, 2, 3, 4];
}
