import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
@Injectable({
	providedIn: 'root'
})
export class SocketioService {

	// private url = 'http://socket-addr';
	// private url = 'http://localhost:3000/socketWebRTC';
	private url = environment.socketUrl
	private _socket: Socket; // type: https://stackoverflow.com/questions/47161589/how-to-use-socket-io-client-in-angular-4


	constructor() {
		// this.socket = io(this.url, {transports: ['websocket']});
		this._socket = io(this.url + '/socketWebRTC', { transports: ['websocket'], path: '/socketWebRTC' });
		// console.log(this._socket);
	}

	get socket() {
		return this._socket;
	}
}
