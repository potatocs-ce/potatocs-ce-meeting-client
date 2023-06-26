import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { Subject } from 'rxjs';
import { pluck, takeUntil, distinctUntilChanged } from 'rxjs/operators'

import { CANVAS_CONFIG, DRAWING_TYPE } from '../../../../@wb/config/config';

import { EditInfoService } from 'src/@wb/store/edit-info.service';
import { EventBusService } from 'src/@wb/services/eventBus/event-bus.service';
import { DrawStorageService } from 'src/@wb/storage/draw-storage.service';
import { ViewInfoService } from 'src/@wb/store/view-info.service';
import { EventData } from 'src/@wb/services/eventBus/event.class';
import { ApiService } from 'src/@wb/services/apiService/api.service';
import { SocketService } from 'src/@wb/services/socket/socket.service';

// icon icon 별로 불러오기
import eraserIcon from '@iconify/icons-mdi/eraser';
import markerIcon from '@iconify/icons-mdi/marker';
import shapeOutlineIcon from '@iconify/icons-mdi/shape-outline';
import { MeetingInfoService } from 'src/@wb/store/meeting-info.service';
import { SelectedViewInfoService } from 'src/@wb/store/selected-view-info.service';

@Component({
    selector: 'app-board-nav',
    templateUrl: './board-nav.component.html',
    styleUrls: ['./board-nav.component.scss']
})
export class BoardNavComponent implements OnInit {
    isSyncMode: boolean;
    colorList = [
        { color: 'black' },
        { color: 'white' },
        { color: 'red' },
        { color: 'blue' },
        { color: 'green' },
        { color: 'yellow' }
    ]
    currentColor = 'black';
    currentTool: string = 'pen';
    menuName: any;
    currentDocNum: any;
    currentPage: any;
    currentDocId: string;
    private socket;
    members; // 참가자 정보를 select 창에 맞게 가공
    private enlistedMembers; // 참가자 정보


    isChecked;

    // iconify TEST //////////////////////
    eraserIcon = eraserIcon;
    shapeOutlineIcon = shapeOutlineIcon;
    markerIcon = markerIcon;
    //////////////////////////////////////

    // Width: 3단계 설정
    widthSet = CANVAS_CONFIG.widthSet;
    currentWidth = {
        pointer: this.widthSet.pointer[0],
        pen: this.widthSet.pen[0],
        highlighter: this.widthSet.highlighter[0],
        eraser: this.widthSet.eraser[2],
        line: this.widthSet.line[0],
        circle: this.widthSet.circle[0],
        rectangle: this.widthSet.rectangle[0],
        roundedRectangle: this.widthSet.roundedRectangle[0],
        textarea: this.widthSet.textarea[0],
        text: this.widthSet.text[0],
    };
    mode: any = 'move';
    myRole: any; // 나의 역할(권한)

    private unsubscribe$ = new Subject<void>();

    constructor(
        private editInfoService: EditInfoService,
        private eventBusService: EventBusService,
        private drawStorageService: DrawStorageService,
        private viewInfoService: ViewInfoService,
        private apiService: ApiService,
        private socketService: SocketService,
        private meetingInfoService: MeetingInfoService,
        private selectedViewInfoService: SelectedViewInfoService
    ) {
        this.socket = this.socketService.socket;
    }


    ngOnInit(): void {
        // 현재 Page 변경
        this.viewInfoService.state$
            .pipe(takeUntil(this.unsubscribe$), pluck('pageInfo'), distinctUntilChanged())
            .subscribe((pageInfo) => {
                this.currentDocNum = pageInfo.currentDocNum;
                this.currentPage = pageInfo.currentPage;
                this.currentDocId = pageInfo.currentDocId;

            });

        this.editInfoService.state$
            .pipe(takeUntil(this.unsubscribe$), distinctUntilChanged())
            .subscribe((editInfo) => {
                // console.log(editInfo);
                this.mode = editInfo.mode;
                this.currentTool = editInfo.tool;
                this.currentColor = editInfo.toolsConfig.pen.color;
                this.currentWidth = {
                    pointer: editInfo.toolsConfig.pointer.width,
                    pen: editInfo.toolsConfig.pen.width,
                    highlighter: editInfo.toolsConfig.highlighter.width,
                    eraser: editInfo.toolsConfig.eraser.width,
                    line: editInfo.toolsConfig.line.width,
                    circle: editInfo.toolsConfig.circle.width,
                    rectangle: editInfo.toolsConfig.rectangle.width,
                    roundedRectangle: editInfo.toolsConfig.roundedRectangle.width,
                    text: editInfo.toolsConfig.text.width,
                    textarea: editInfo.toolsConfig.textarea.width,
                }
            });

        /*-------------------------------------------
                role에 따라 권한 설정
            ---------------------------------------------*/
        this.eventBusService.on('myRole', this.unsubscribe$, (myRole) => {
            this.myRole = myRole.role

            if (this.myRole == 'Participant') {
                this.changeMode('move')
            }

        })


        // 실시간으로 meeitngInfo를 바라보고 있다.
        this.meetingInfoService.state$
            .pipe(takeUntil(this.unsubscribe$)).subscribe(async (meetingInfo) => {
                if (meetingInfo) {
                    // 미팅 참가자들을 가져와 사용자별 판서 모드에 사용되는 html DOM으로 사용
                    this.members = meetingInfo.enlistedMembers.map(x => {
                        return {
                            _id: x._id,
                            isSelected: true,
                            name: x.name
                        }
                    })

                    // 미팅 참가자를 이용해 사용자별 판서 모드 상태관리
                    const selectedViewInfo = {
                        ...this.selectedViewInfoService.state,
                        isSelectedViewMode: false,
                        selectedUserInfo: await this.members.map(x => {
                            return { isSelected: true, selectedUserId: x._id }
                        })
                    }
                    this.isChecked = true;
                    this.selectedViewInfoService.setSelectedViewInfo(selectedViewInfo);


                }
            });



    }


    /**
     * 색상 변경
     *
     * - 현재 pen인 경우에만 반응
     * @param color 색상 : 향후 HEXA로 변경 고려
     *
     */
    changeColor(color) {
        const editInfo = Object.assign({}, this.editInfoService.state);
        editInfo.mode = 'draw';
        if (editInfo.mode != 'draw' || (editInfo.tool == 'erasar' || editInfo.tool == 'pointer')) return;
        editInfo.toolsConfig.pen.color = color;
        editInfo.toolsConfig.highlighter.color = color;
        editInfo.toolsConfig.line.color = color;
        editInfo.toolsConfig.circle.color = color;
        editInfo.toolsConfig.rectangle.color = color;
        editInfo.toolsConfig.roundedRectangle.color = color;
        editInfo.toolsConfig.text.color = color;
        this.editInfoService.setEditInfo(editInfo);
    }

    /**
     * Width 변경
     *
     * -현재 Pen 또는 eraser인 경우에만 반응
     *
     * @param width
     */
    changeWidth(width) {

        const editInfo = Object.assign({}, this.editInfoService.state);

        if (editInfo.mode != 'draw') return;

        // textarea 모드거나 text모드 상태에서 width를 수정하면 같이 바뀥다.
        if (editInfo.tool == 'text' || editInfo.tool == 'textarea') {
            editInfo.toolsConfig['text'].width = width;
            editInfo.toolsConfig['textarea'].width = width;
        } else {
            const tool = editInfo.tool; // tool: 'pen', 'eraser', 'shape'
            editInfo.toolsConfig[tool].width = width;
        }
        this.editInfoService.setEditInfo(editInfo);
    }


    /**
     * Pen, Eraser 선택
     *
     * @param tool : 'pen', 'eraser'
     *
     */
    async changeTool(tool) {
        // console.log(tool)
        const editInfo = Object.assign({}, this.editInfoService.state);


        if (editInfo.tool == 'eraser' && editInfo.mode == 'draw' && tool == 'eraser') {
            if (confirm("Do you want to delete all drawings on the current page?")) {
                const data = {
                    docId: this.currentDocId,
                    currentDocNum: this.currentDocNum,
                    currentPage: this.currentPage
                }
                // 다른 사람들에게 드로우 이벤트 제거
                this.socket.emit('clearDrawingEvents', data)
                // 자기자신한테 있는 드로우 이벤트 제거
                this.drawStorageService.clearDrawingEvents(this.currentDocNum, this.currentPage);
                this.eventBusService.emit(new EventData('rmoveDrawEventPageRendering', ''));
                this.eventBusService.emit(new EventData('rmoveDrawEventThumRendering', ''));
            } else {
                return;
            }
        }
        editInfo.mode = 'draw';
        editInfo.tool = tool;
        this.editInfoService.setEditInfo(editInfo);

        // 지우개 2번 Click은 여기서 check 하는 것이 좋을 듯?

    }

    /**
     * Move 선택
     *
     * @param mode : 현재는 'move'만 있음 (향후 sync?)
     *
     */
    changeMode(mode) {
        const editInfo = Object.assign({}, this.editInfoService.state);
        editInfo.mode = 'move';
        this.editInfoService.setEditInfo(editInfo);
    }

    /**
     * 사용자별 판서 모드
     * ALL 클릭 시 사용자별 판서모드는 false가 되고
     * 사용자 별 판서 전체가 true로 바뀜
     */
    changeSeletedViewMode() {
        if (this.isChecked) {
            // All 버튼 클릭 시 사용자별 판서 모드로 사용되는 DOM 요소들 전부 true로 바꿈
            this.members = this.members.map(x => { return { ...x, isSelected: false } })
            // All 버튼 클릭 시 사용자별 판서 모드는 false가 되고 사용되는 상태들을 true로 바꿈
            const getSelectedViewInfo = Object.assign({}, this.selectedViewInfoService.state);
            const selectedViewInfo = {
                ...getSelectedViewInfo,
                isSelectedViewMode: true,
                selectedUserInfo: this.members
            }
            this.selectedViewInfoService.setSelectedViewInfo(selectedViewInfo);
            this.isChecked = false

        } else {
            this.members = this.members.map(x => { return { ...x, isSelected: true } })

            // All 버튼 클릭 시 사용자별 판서 모드는 false가 되고 사용되는 상태들을 true로 바꿈
            const getSelectedViewInfo = Object.assign({}, this.selectedViewInfoService.state);
            const selectedViewInfo = {
                ...getSelectedViewInfo,
                isSelectedViewMode: false,
                selectedUserInfo: this.members
            }
            this.selectedViewInfoService.setSelectedViewInfo(selectedViewInfo);
            this.isChecked = true;
        }

        console.log('-------------------------------')
        console.log('ALL Button isSelectedViewMode:', this.isChecked)
        console.log('-------------------------------')
        // this.isSelectedViewMode checkbox 체크 변경


    }

    /**
     * 사용자별 판서 모드
     * seletedViewMode 사용자 선택
     * @param memberId : 는 선택한 사용자 Id
     */
    async updateSeletedUser(memberId) {
        const getSelectedViewInfo = Object.assign({}, this.selectedViewInfoService.state);

        const selectedViewInfo = {
            ...getSelectedViewInfo,
            isSelectedViewMode: true,
            selectedUserInfo: getSelectedViewInfo.selectedUserInfo.map((x) => {
                if (x.selectedUserId === memberId) {
                    return { ...x, isSelected: !x.isSelected }
                }
                return x
            })
        }
        this.isChecked = false;
        /**
         * 만약 ALL을 누르지 않고 모든 사람들을 체크할 경우
         * isSelectedViewMode를 false로
         */
        const isCheckALLMod = await selectedViewInfo.selectedUserInfo.every(x => { return x.isSelected })
        if (isCheckALLMod) {
            selectedViewInfo.isSelectedViewMode = false
            this.isChecked = true;
        }

        this.selectedViewInfoService.setSelectedViewInfo(selectedViewInfo);

        console.log('-------------------------------')
        console.log('Select Button isSelectedViewMode:', this.isChecked)
        console.log('-------------------------------')
    }

}