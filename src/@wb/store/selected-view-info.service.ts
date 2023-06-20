import { Injectable } from '@angular/core';
import { Store } from './store';

class SelectedViewInfo {
    selectedViewMode: Boolean = false;
    selectedUserId: string = '';
}

/**
 * Selected View Info Service는
 * 사용자별 판서 모드이다.
 * 사용자별 판서 모드인지 아닌지 판별하는 boolean 값과 선택된 사용자의 아이디를 보관한다.
 */
@Injectable({
    providedIn: 'root'
})
export class SelectedViewInfoService extends Store<any> {

    constructor() {
        super(new SelectedViewInfo);
    }

    setSelectedViewInfo(selectedViewInfo): void {
        this.setState({
            ...this.state, ...selectedViewInfo
        });
    }

}
