import { Injectable } from '@angular/core';
import { Store } from './store';

@Injectable({
	providedIn: 'root'
})
export class DevicesInfoService extends Store<any> {

	constructor() {
		super({});
	}

  setDevicesInfo(DeviceInf : any) : void {
    this.setState({
      ...this.state, ...DeviceInf
    });
  }

}
