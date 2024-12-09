import { Injectable, signal } from '@angular/core';


type toolType = {
  type: string,
  color: string,
  width: number,
}

@Injectable({
  providedIn: 'root'
})
export class ToolService {

  constructor() { }

  tool = signal<toolType>({
    type: 'click',
    color: 'black',
    width: 1
  })
}
