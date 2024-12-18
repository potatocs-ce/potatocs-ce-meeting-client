import { Component, ElementRef, ViewChild, effect } from "@angular/core";
import { FormBuilder, FormsModule } from "@angular/forms";
import { debounceTime, fromEvent, Subject, takeUntil } from "rxjs";
import { MeetingService } from "../../services/meeting/meeting.service";
import { ActivatedRoute } from "@angular/router";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { VideoService } from "../../services/video/video.service";
import { MediasoupService } from "../../services/mediasoup/mediasoup.service";
import { MatButtonModule } from "@angular/material/button";
import { MatSnackBar } from "@angular/material/snack-bar";

interface MediaStreamConstraints {
	audio: MediaTrackConstraints | boolean;
	video: MediaTrackConstraints | boolean;
}

interface DeviceInfo {
	kind: string;
	label: string;
	id: string;
}

@Component({
	selector: "app-device-check",
	standalone: true,
	imports: [CommonModule, MatCardModule, MatCheckboxModule, FormsModule, MatButtonModule],
	templateUrl: "./device-check.component.html",
	styleUrl: "./device-check.component.scss",
})
export class DeviceCheckComponent {
	miceDevices: any = []; // 마이크 장치 리스트
	videoDevices: any = []; // 카메라 리스트
	speakerDevices: any = []; // 스피커 장치 리스트

	devicesInfo: any;

	selectedMiceDevice: any; // 선택된 마이크 장치
	selectedVideoDevice: any; // 선택된 카메라 장치
	selectedSpeakerDevice: any; // 선택된 스피커 장치
	selectedDevices: any;
	audioDeviceExist: boolean = true;
	videoDeviceExist: boolean = true;

	isChecked: any;
	cameraOn: boolean = true;
	cameraOff: boolean = false;

	meetingId: any;
	meetingClose = false;

	browserInfo: any;
	browserVersion: any;
	soundMeterInterval: any;
	localStream$: any;
	soundLevel: any;
	private unsubscribe$ = new Subject<void>();

	@ViewChild("video", { static: true }) public videoRef: ElementRef | any;

	private readonly destroy$ = new Subject<void>();
	private readonly deviceChange$ = new Subject<void>();
	private currentStream: MediaStream | null = null;
	private mediaStreamCache = new Map<string, MediaStream>();

	video: any;
	stream: any;

	check_video_onoff: boolean = false;

	constructor(
		// private eventBusService: EventBusService,
		public fb: FormBuilder,
		// private devicesInfoService: DevicesInfoService,
		private meetingService: MeetingService,
		private route: ActivatedRoute,
		// private webrtcService: WebRTCService,
		private videoService: VideoService,
		private mediasoupService: MediasoupService,
		private snackBar: MatSnackBar
	) {
		// 디바운스된 디바이스 변경 처리
		this.deviceChange$
			.pipe(
				debounceTime(300), // 300ms 디바운스
				takeUntil(this.destroy$)
			)
			.subscribe(() => {
				this.handleDeviceChange();
			});
	}

	ngOnInit() {
		this.meetingId = this.route.snapshot.params["id"];

		this.video = this.videoRef.nativeElement;

		this.initializeDeviceMonitoring();
		this.initializeDevices();

		// // 컴퓨터에 연결된 장치 추가/제거 시 실시간으로 목록 수정
		// this.deviceChangeCheck();
	}

	private initializeDeviceMonitoring(): void {
		// devicechange 이벤트에 대한 디바운스된 핸들러 설정
		fromEvent(navigator.mediaDevices, "devicechange")
			.pipe(debounceTime(300), takeUntil(this.destroy$))
			.subscribe(() => {
				this.deviceChange$.next();
			});
	}

	private async initializeDevices(): Promise<void> {
		try {
			await this.updateDeviceList();
			await this.initializeMediaStream();
		} catch (error) {
			console.error("Failed to initialize devices:", error);
			// 적절한 에러 처리 및 사용자 알림
		}
	}

	private async updateDeviceList(): Promise<void> {
		const devices = await navigator.mediaDevices.enumerateDevices();

		this.videoService.audioDevices.set([]);
		this.videoService.videoDeivces.set([]);
		this.videoService.speakerDevices.set([]);

		// 디바이스 목록 업데이트 로직
		this.miceDevices = devices
			.filter((device) => device.kind === "audioinput")
			.map((device) => {
				this.videoService.audioDevices.set([
					...this.videoService.audioDevices(),
					{ kind: device.kind, label: device.label, deviceId: device.deviceId },
				]);
				return {
					kind: device.kind,
					label: device.label,
					id: device.deviceId,
				};
			});

		this.videoDevices = devices
			.filter((device) => device.kind === "videoinput")
			.map((device) => {
				this.videoService.videoDeivces.set([
					...this.videoService.videoDeivces(),
					{ kind: device.kind, label: device.label, deviceId: device.deviceId },
				]);
				return {
					kind: device.kind,
					label: device.label,
					id: device.deviceId,
				};
			});

		this.speakerDevices = devices
			.filter((device) => device.kind === "audiooutput")
			.map((device) => {
				this.videoService.speakerDevices.set([
					...this.videoService.speakerDevices(),
					{ kind: device.kind, label: device.label, deviceId: device.deviceId },
				]);
				return {
					kind: device.kind,
					label: device.label,
					id: device.deviceId,
				};
			});

		// 디바이스 권한이 없는 경우
		if (!this.videoDevices[0]?.label && this.videoDevices[0]?.kind == "videoinput") {
			try {
				// 명시적인 권한 요청
				const stream = await navigator.mediaDevices.getUserMedia({
					video: true,
					audio: true,
				});

				// 권한이 승인되면 스트림 정리
				stream.getTracks().forEach((track) => track.stop());

				await this.initializeDevices();

				this.snackBar.open("Media device permissions granted.", "OK", {
					duration: 3000,
				});
			} catch (error) {
				this.handlePermissionDenied(error);
			}
		}

		// 초기 선택 디바이스 설정
		this.selectedMiceDevice = this.miceDevices[0];
		this.videoService.nowAudioId.set(this.miceDevices[0].deviceId);
		this.selectedVideoDevice = this.videoDevices[0];
		this.videoService.nowVideoId.set(this.videoDevices[0].deviceId);
		this.selectedSpeakerDevice = this.speakerDevices[0];
		this.videoService.nowSpeakerId.set(this.speakerDevices[0].deviceId);
	}

	private handlePermissionDenied(error?: any): void {
		let message = "Media device permissions denied.";

		if (error instanceof DOMException) {
			switch (error.name) {
				case "NotAllowedError":
					message = "User denied media device access.";
					break;
				case "NotFoundError":
					message = "No media devices found.";
					break;
				case "NotReadableError":
					message = "Cannot access media devices.";
					break;
				default:
					message = `Error accessing media devices: ${error.message}`;
			}
		}

		this.snackBar.open(message, "확인", {
			duration: 5000,
			panelClass: ["error-snackbar"],
		});
	}

	private async initializeMediaStream(): Promise<void> {
		if (!this.selectedVideoDevice || !this.selectedMiceDevice) return;

		const constraints = this.createConstraints();
		const cacheKey = this.createCacheKey(constraints);

		try {
			let stream = this.mediaStreamCache.get(cacheKey);

			if (!stream) {
				stream = await navigator.mediaDevices.getUserMedia(constraints);
				this.mediaStreamCache.set(cacheKey, stream);
			}

			this.currentStream = stream;
			this.updateVideoElement(stream);
		} catch (error) {
			console.error("Failed to initialize media stream:", error);
			// 적절한 에러 처리 및 사용자 알림
		}
	}

	private createConstraints(): MediaStreamConstraints {
		this.videoService.nowVideoId.set(this.selectedVideoDevice.id);
		this.videoService.nowAudioId.set(this.selectedMiceDevice.id);
		return {
			audio: this.selectedMiceDevice
				? {
						deviceId: { exact: this.selectedMiceDevice.id },
						echoCancellation: true,
						noiseSuppression: true,
				  }
				: false,
			video: this.selectedVideoDevice
				? {
						deviceId: { exact: this.selectedVideoDevice.id },
						width: { ideal: 320 },
						height: { ideal: 240 },
				  }
				: false,
		};
	}

	private createCacheKey(constraints: MediaStreamConstraints): string {
		return JSON.stringify({
			audioId: this.selectedMiceDevice?.id,
			videoId: this.selectedVideoDevice?.id,
		});
	}

	private updateVideoElement(stream: MediaStream): void {
		const videoElement = this.videoRef.nativeElement;
		if (videoElement.srcObject !== stream) {
			videoElement.srcObject = stream;
		}
	}

	// 디바이스 변경 처리
	private async handleDeviceChange(): Promise<void> {
		const oldDevices = {
			audio: this.selectedMiceDevice?.id,
			video: this.selectedVideoDevice?.id,
		};

		await this.updateDeviceList();

		const devicesChanged =
			oldDevices.audio !== this.selectedMiceDevice?.id || oldDevices.video !== this.selectedVideoDevice?.id;

		if (devicesChanged) {
			await this.initializeMediaStream();
		}
	}

	// 디바이스 선택 변경 처리
	async onDeviceSelectionChange(): Promise<void> {
		if (this.currentStream) {
			// 현재 스트림의 모든 트랙 중지
			this.currentStream.getTracks().forEach((track) => track.stop());
		}

		// 캐시에서 이전 스트림들 정리
		for (const [key, stream] of this.mediaStreamCache) {
			stream.getTracks().forEach((track) => track.stop());
			this.mediaStreamCache.delete(key);
		}

		await this.initializeMediaStream();
	}

	ngOnDestroy(): void {
		// 모든 스트림 정리
		if (this.currentStream) {
			this.currentStream.getTracks().forEach((track) => track.stop());
		}

		// 캐시된 모든 스트림 정리
		for (const [, stream] of this.mediaStreamCache) {
			stream.getTracks().forEach((track) => track.stop());
		}
		this.mediaStreamCache.clear();

		// RxJS 구독 정리
		this.destroy$.next();
		this.destroy$.complete();
	}

	// 채널 참가 main component로 이동
	async joinMeetingRoom() {
		// this.eventBusService.emit(new EventData('join', ''));
		// this.eventBusService.emit(new EventData('deviceCheck', ''))

		// 지금 stream 데이터 종료
		try {
			const stream = this.video.srcObject;
			if (stream) {
				const tracks = stream.getTracks();
				tracks.forEach((track: any) => track.stop());
			}

			await this.mediasoupService.joinRoom();
			this.meetingService.device_check.set(true);
		} catch (error) {
			console.error("Error joining meeting room:", error);
			// 에러 처리
		}
	}

	async toggleDevices(isChecked: boolean): Promise<void> {
		try {
			if (isChecked) {
				// 디바이스 끄기
				if (this.currentStream) {
					this.currentStream.getTracks().forEach((track) => track.stop());
				}
				// 캐시된 스트림 정리
				for (const [key, stream] of this.mediaStreamCache) {
					stream.getTracks().forEach((track) => track.stop());
					this.mediaStreamCache.delete(key);
				}
				// 비디오 엘리먼트 스트림 제거
				this.videoRef.nativeElement.srcObject = null;
				this.currentStream = null;
				this.videoService.check_video_onoff.set(true);

				this.snackBar.open("Camera and microphone deactivated.", "OK", {
					duration: 3000,
				});
			} else {
				// 디바이스 켜기
				if (!this.selectedVideoDevice || !this.selectedMiceDevice) {
					this.snackBar.open("No devices selected.", "OK", {
						duration: 3000,
					});
					return;
				}

				const constraints = this.createConstraints();
				let stream: MediaStream;
				try {
					stream = await navigator.mediaDevices.getUserMedia(constraints);
					const cacheKey = this.createCacheKey(constraints);

					this.mediaStreamCache.set(cacheKey, stream);
					this.currentStream = stream;
					this.updateVideoElement(stream);
					this.videoService.check_video_onoff.set(false);

					this.snackBar.open("Camera and microphone activated.", "OK", {
						duration: 3000,
					});
				} catch (error: any) {
					let errorMessage = "Error activating devices.";

					if (error.name === "NotAllowedError") {
						errorMessage = "Camera/microphone access denied.";
					} else if (error.name === "NotFoundError") {
						errorMessage = "Selected devices not found.";
					} else if (error.name === "NotReadableError") {
						errorMessage = "Devices already in use by another application.";
					}

					this.snackBar.open(errorMessage, "OK", {
						duration: 5000,
						panelClass: ["error-snackbar"],
					});

					// 에러 발생 시 체크박스 상태 되돌리기
					this.isChecked = true;
					this.videoService.check_video_onoff.set(false);
				}
			}
		} catch (error) {
			console.error("Error toggling devices:", error);
			this.snackBar.open("Error occurred while changing device state.", "OK", {
				duration: 5000,
				panelClass: ["error-snackbar"],
			});
		}
	}

	// 브라우저 체크
	browserCheck() {
		var userAgent: any = navigator.userAgent;
		var reg: any = null;
		var browser: any = {
			name: null,
			version: null,
		};

		userAgent = userAgent.toLowerCase();

		if (userAgent.indexOf("opr") !== -1) {
			reg = /opr\/(\S+)/;
			browser.name = "Opera";
			// browser.version = reg.exec(userAgent)[1];
			browser.version = reg.exec(userAgent)[1].substring(0, reg.exec(userAgent)[1].indexOf("."));
		} else if (userAgent.indexOf("edge") !== -1) {
			reg = /edge\/(\S+)/;
			browser.name = "Edge";
			browser.version = reg.exec(userAgent)[1].substring(0, reg.exec(userAgent)[1].indexOf("."));
		} else if (userAgent.indexOf("chrome") !== -1) {
			reg = /chrome\/(\S+)/;
			browser.name = "Chrome";
			browser.version = reg.exec(userAgent)[1].substring(0, reg.exec(userAgent)[1].indexOf("."));
		} else if (userAgent.indexOf("safari") !== -1) {
			reg = /safari\/(\S+)/;
			browser.name = "Safari";
			browser.version = reg.exec(userAgent)[1].substring(0, reg.exec(userAgent)[1].indexOf("."));
		} else if (userAgent.indexOf("firefox") !== -1) {
			reg = /firefox\/(\S+)/;
			browser.name = "Firefox";
			browser.version = reg.exec(userAgent)[1].substring(0, reg.exec(userAgent)[1].indexOf("."));
		} else if (userAgent.indexOf("trident") !== -1) {
			browser.name = "IE";

			if (userAgent.indexOf("msie") !== -1) {
				reg = /msie (\S+)/;
				browser.version = reg.exec(userAgent)[1].substring(0, reg.exec(userAgent)[1].indexOf("."));
				browser.version = browser.version.replace(";", "");
			} else {
				reg = /rv:(\S+)/;
				browser.version = reg.exec(userAgent)[1].substring(0, reg.exec(userAgent)[1].indexOf("."));
			}
		}

		return (this.browserInfo = browser);
	}
}
