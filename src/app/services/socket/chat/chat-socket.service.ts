import { Injectable } from "@angular/core";
import { Socket } from "ngx-socket-io";
import { MeetingService } from "../../meeting/meeting.service";
import { MeetingServiceAPI } from "../../../api/meeting/meetingAPI.service";
import { DrawingService } from "../../drawing/drawing.service";

@Injectable({
	providedIn: "root",
})
export class ChatSocketService {
	constructor(
		private socket: Socket,
		private meetingService: MeetingService,
		private meetingServiceApi: MeetingServiceAPI,
		private drawingService: DrawingService
	) {
		this.socket.on("receiveChatData", (chatData: any) => {
			for (let i = 0; i < chatData.images.length; i++) {
				this.meetingServiceApi.getChatImage(chatData.images[i].key).subscribe((res2: any) => {
					chatData.images[i].blob = URL.createObjectURL(res2);

					// canvas 생성
					const canvas: any = document.createElement("canvas");
					// height는 50px 고정
					canvas.width = 160;
					// width 는 height랑 비율 맞춰서 지정
					canvas.height = chatData.images[i].height * (160 / chatData.images[i].width);

					// getContext
					const context: any = canvas.getContext("2d");
					// 50px 로 줄어들면 얼마나 줄어든건지 계산
					const zoomScale = 160 / chatData.images[i].width;

					// canvas 스케일 변경 젹용
					context.setTransform(zoomScale, 0, 0, zoomScale, 0, 0);
					// 그림 그리기
					// console.log(chatData.images[j])
					chatData.images[i].drawingDatas?.forEach((data: any) => {
						this.drawingService.end(context, data.points, data.tool);
					});

					canvas.style.position = "absolute";
					canvas.style.top = "0";
					canvas.style.left = "0";
					chatData.images[i].canvas = canvas;
				});
			}
			meetingService.meeting_chat_info.set([...this.meetingService.meeting_chat_info(), chatData]);
		});
	}

	sendChat(data: any) {
		data.room_id = this.meetingService.meeting_room_id();
		this.socket.emit("sendChat", data, async (chatData: any) => {
			for (let i = 0; i < chatData.images.length; i++) {
				this.meetingServiceApi.getChatImage(chatData.images[i].key).subscribe((res2: any) => {
					chatData.images[i].blob = URL.createObjectURL(res2);

					// canvas 생성
					const canvas: any = document.createElement("canvas");

					// canvas의 width 설정 (고정값 160px)
					canvas.width = 160;

					// canvas의 height 설정
					// 원본 이미지의 비율을 유지하면서 width를 기준으로 계산
					canvas.height = chatData.images[i].height * (160 / chatData.images[i].width);

					// canvas의 2D 컨텍스트 가져오기
					const context: any = canvas.getContext("2d");

					// 확대/축소 비율 계산
					// 원본 이미지의 너비를 기준으로 160px로 줄어들었을 때의 스케일 계산
					const zoomScale = 160 / chatData.images[i].width;

					// canvas에 확대/축소 비율 적용
					// setTransform으로 확대/축소 비율을 설정 (scaleX, skewX, skewY, scaleY, translateX, translateY)
					context.setTransform(zoomScale, 0, 0, zoomScale, 0, 0);

					// 그림 데이터 반복 처리 및 그리기
					// 각 drawingData의 점(points)과 도구(tool)를 사용해 그림을 그림
					chatData.images[i].drawingDatas?.forEach((data: any) => {
						this.drawingService.end(context, data.points, data.tool);
					});

					// canvas 스타일 설정
					// absolute 위치 지정으로 다른 요소와 겹치지 않도록 설정
					canvas.style.position = "absolute";
					canvas.style.top = "0"; // 상단 0 위치
					canvas.style.left = "0"; // 좌측 0 위치

					// canvas를 chatData 이미지 객체에 추가
					chatData.images[i].canvas = canvas;
				});
			}

			this.meetingService.meeting_chat_info.set([...this.meetingService.meeting_chat_info(), chatData]);
		});
	}
}
