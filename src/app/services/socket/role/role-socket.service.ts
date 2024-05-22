import { Injectable } from '@angular/core';
import { reject } from 'lodash';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root'
})
export class RoleSocketService {

  constructor(private socket: Socket) { }



  // role 업데이트 하기
  updateRole(room_id: string, role: string, member_id: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const data = {
        room_id,
        role,
        member_id
      }
      this.socket.emit('updateRole', data, (res: any) => {
        if (res == 'success') {
          resolve('success');
        } else {
          reject(new Error('Failed to update role'))
        }
      })
    })
  }




}
