
import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { EventBusService } from 'src/@wb/services/eventBus/event-bus.service';
import { EventData } from 'src/app/services/eventBus/event.class';
import { ParticipantsService } from 'src/app/services/participants/participants.service';
import { SocketioService } from 'src/app/services/socketio/socketio.service';
import { DialogService } from '../auth/sign-in/dialog/dialog.service';



///////////////////
export interface DialogData {
}
///////////////////


@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

    private unsubscribe$ = new Subject<void>();

    private socket;

    participants: any;
    cameraOff: boolean = false;
    mute: boolean = false;
    cameraIcon = 'videocam_on';
    muteIcon = 'mic';
    toggleIcon = 'density_medium';


    @ViewChild('cameraBtn') public cameraBtnRef: ElementRef;
    get cameraBtn(): HTMLButtonElement {
        return this.cameraBtnRef.nativeElement;
    }



    constructor(
        private particpantsService: ParticipantsService,
        private eventBusService: EventBusService,
        ///////////////////
        public dialog: MatDialog,
        ///////////////////
        private socketService: SocketioService,
        private dialogService: DialogService,

    ) {
        this.socket = socketService.socket;
    }

    ngOnInit(): void {

        this.eventBusService.on('toggle', this.unsubscribe$, () => {
            if (this.toggleIcon == 'density_medium') {
                this.toggleIcon = 'arrow_back_ios';
            } else if (this.toggleIcon == 'arrow_back_ios') {
                this.toggleIcon = 'density_medium';
            }
        })


    }

    // 토글 버튼
    toggle() {
        this.eventBusService.emit(new EventData('toggle', ''));

        // if(this.toggleIcon == 'density_medium'){
        //     this.toggleIcon = 'arrow_back_ios';
        // } else if(this.toggleIcon == 'arrow_back_ios') {
        //     this.toggleIcon = 'density_medium';
        // }                       
    }



    // 카메라 On / Off
    handleCameraClick() {
        if (this.cameraOff) {
            console.log('Camera On')
            // this.cameraBtn.innerText = "Camera Off";
            this.cameraIcon = 'videocam_on'
            this.cameraOff = false;
            this.particpantsService.participants.subscribe((participants: any) => {
                participants.rtcPeer.videoEnabled = true;
            })
        } else {
            console.log('Camera Off')
            this.cameraIcon = 'videocam_off'
            // this.cameraBtn.innerText = "Camera On";
            this.cameraOff = true;
            // this.participants[this.userName].rtcPeer.videoEnabled = false;
            this.particpantsService.participants.subscribe((participants: any) => {
                participants.rtcPeer.videoEnabled = false;
            })
        }
    }


    // 음소거
    handleMuteClick() {
        this.eventBusService.emit(new EventData('handleMuteClick', ''))
        console.log('volume_up On')
        if (this.mute) {

            this.muteIcon = 'mic'
            this.mute = false;
        } else {
            this.muteIcon = 'mic_off'
            this.mute = true;
        }
    }

    // 미팅 나가기 
    meetingExit() {
        this.dialogService.openDialogConfirm('Would you like to leave the room?').subscribe(result => {
            if (result) {
                this.socket.emit('participantLeft');
                window.close();
            }
        });
    }




    // bitrate setting
    openDialog(): void {
        const dialogRef = this.dialog.open(DialogUpdateBitrateComponent, {
            width: '350px',

        });

        dialogRef.afterClosed().subscribe(result => {
            console.log('The dialog was closed');
            // this.bitrate = result;
        });
    }
}





@Component({
    selector: 'app-dialog-update-bitrate',
    templateUrl: './dialogs/dialog-update-bitrate.html',
})

export class DialogUpdateBitrateComponent implements OnInit {

    private socket;
    //////////////////////////
    favoriteSeason: number;
    bitrates: number[] = [100, 200, 300];

    changebitrateForm: FormGroup;
    //////////////////////////
    constructor(
        public bitrateDialogRef: MatDialogRef<DialogUpdateBitrateComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        private socketService: SocketioService,
        //////////////////////////
        private fb: FormBuilder,
        //////////////////////////
        private eventBusService: EventBusService,
    ) {

        this.socket = socketService.socket;

    }


    ngOnInit(): void {
        //////////////////////////
        this.changebitrateForm = this.fb.group({
            bitrate: ['', Validators.required]
        });
        //////////////////////////
    }

    onSubmit() {
        const bitrate = this.changebitrateForm.value;
        console.log(bitrate)

        if (bitrate.bitrate == '') {
            return
        } else {
            this.eventBusService.emit(new EventData('handleBitrateClick', bitrate.bitrate))

        }

    }

    onNoClick(): void {

        this.bitrateDialogRef.close();
    }


}
