import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-audience-video',
  standalone: true,
  imports: [],
  templateUrl: './audience-video.component.html',
  styleUrl: './audience-video.component.scss'
})
export class AudienceVideoComponent {
  @Input() stream: any = '';
}
