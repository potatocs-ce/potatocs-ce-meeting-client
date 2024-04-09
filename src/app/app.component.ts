import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ToolbarComponent } from './layout/toolbar/toolbar.component';
import { MenuComponent } from './layout/menu/menu.component';
import { ToggleService } from './services/toggle.service';
import { PresentComponent } from './components/present/present.component';
import { AudienceComponent } from './components/audience/audience.component';
import { WhiteboardComponent } from './components/whiteboard/whiteboard.component';
import { DocumentsComponent } from './components/documents/documents.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet,
    ToolbarComponent, MenuComponent,
    PresentComponent, AudienceComponent,
    WhiteboardComponent, DocumentsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'meeting_front';
  toggle_mode: string = '';
  toggle_video: string = '';
  constructor(private toggleService: ToggleService) {
    effect(() => {
      this.toggle_mode = this.toggleService.toggle_mode();
      this.toggle_video = this.toggleService.toggle_video();
    })
  }
}
