import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ToolbarComponent } from './layout/toolbar/toolbar.component';
import { MenuComponent } from './layout/menu/menu.component';
import { ToggleService } from './services/toggle.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ToolbarComponent, MenuComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'meeting_front';
  toggle_mode: string = '';
  constructor(private toggleService: ToggleService) {
    effect(() => {
      this.toggle_mode = this.toggleService.toggle_mode();
    })
  }
}
