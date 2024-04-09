import { Component, effect } from '@angular/core';
import { ToggleService } from '../../services/toggle.service';
import { CommonModule } from '@angular/common';
import { GroupComponent } from '../../components/group/group.component';
import { ChatComponent } from '../../components/chat/chat.component';
import { SurveyComponent } from '../../components/survey/survey.component';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, GroupComponent, ChatComponent, SurveyComponent],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {
  toggle_mode: string = '';
  constructor(private toggleService: ToggleService) {
    effect(() => {
      this.toggle_mode = this.toggleService.toggle_mode();
    })
  }
}
