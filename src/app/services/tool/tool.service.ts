import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ToolService {

  constructor() { }

  color = signal<string>('');
  width = signal<number>(1);
  type = signal<string>('');
}
