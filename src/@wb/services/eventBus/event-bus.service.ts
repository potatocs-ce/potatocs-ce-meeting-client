import { Injectable } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import { EventData } from './event.class';

@Injectable({
  providedIn: 'root'
})
export class EventBusService {
  private subject$ = new Subject();
  constructor() { }
  emit(event: EventData) {
    this.subject$.next(event);
  }

  on(eventName: string, unsubscribe$: any, action: any): Subscription {
    return this.subject$.pipe(
      takeUntil(unsubscribe$),
      filter( (e: EventData) => e.name === eventName),
      map( (e: EventData) => e["value"])).subscribe(action);
  }
}
