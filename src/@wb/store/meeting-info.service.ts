import { Injectable } from '@angular/core';
import { Store } from './store';

@Injectable({
	providedIn: 'root'
})
export class MeetingInfoService extends Store<any> {

	constructor() {
		super({});
	}

  setMeetingInfo(meetingInfo : any) : void {
    this.setState({
      ...this.state, ...meetingInfo
    });
  }

}
