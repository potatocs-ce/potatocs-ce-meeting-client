import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ToggleService {

  toggle_mode = signal('group')

  constructor() { }
}
