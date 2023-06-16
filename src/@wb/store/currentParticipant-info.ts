import { Injectable } from '@angular/core';
import { Store } from './store';

@Injectable({
	providedIn: 'root'
})
export class CurrentParticipantInfoService extends Store<any> {

	constructor() {
		super({});
	}

  setParticipantInfo(ParticipantInf : any) : void {
    this.setState({
      ...this.state, ...ParticipantInf
    });
  }

}
