import { Directive, HostBinding, Input, Output, Renderer2, ElementRef, SimpleChanges } from '@angular/core';


@Directive({
  standalone: true,
  selector: '[dragScroll]'
})
/**
 * Renderer2를 사용한 Directive
 */
export class DragScrollDirective {
  private listenFunc1: any | undefined = undefined;
  private listenFunc2: any | undefined = undefined;
  private listenFunc3: any | undefined = undefined;
  private listenFunc4: any | undefined = undefined;

  private pos = { top: 0, left: 0, x: 0, y: 0 };

  constructor(
    private renderer: Renderer2,
    private el: ElementRef) { }

  // directive이름과 input이름을 같게 설정하면 혼용해서 사용가능
  // https://angular.io/guide/attribute-directives
  @Input() public dragScroll: boolean = true;

  @HostBinding('style.cursor') private cursor: any;

  ngOnInit() {
  }

  ngOnDestroy() {
    // remove Listener : directive에도 필요할까?
    // https://stackoverflow.com/questions/44454203/angular-renderer2-remove-listener
    if (this.listenFunc1) {
      this.listenFunc1();
    }
  }

  ngOnChanges(changes: SimpleChanges) {

    // 변경 사항에 dragScroll 포함된 경우만.
    if (!changes['dragScroll']) return;

    // add event listener
    // https://stackoverflow.com/questions/41609937/how-to-bind-event-listener-for-rendered-elements-in-angular-2
    // down만 등록 => 나머지 event는 down click 후에 등록, up에서 해제
    if (this.dragScroll) {
      if (!this.listenFunc1) {
        this.listenFunc1 = this.renderer.listen(this.el.nativeElement, 'pointerdown', this.downEvt.bind(this));
      }
      this.cursor = 'grab';

    }
    // remove listener
    else {
      if (this.listenFunc1) {
        this.listenFunc1();
        this.listenFunc1 = null;
      }
      this.cursor = 'default';
    }
  }


  downEvt(evt: any) {
    // if (!this.allowDragScroll) return;

    this.cursor = 'grabbing';

    if (this.listenFunc2 || this.listenFunc3 || this.listenFunc4) {
      this.listenFunc2();
      this.listenFunc3();
      this.listenFunc4();
    }


    this.pos = {
      left: this.el.nativeElement.scrollLeft,
      top: this.el.nativeElement.scrollTop,
      x: evt.clientX,
      y: evt.clientY,
    }

    this.listenFunc2 = this.renderer.listen(this.el.nativeElement, 'pointermove', this.moveEvt.bind(this));
    this.listenFunc3 = this.renderer.listen(this.el.nativeElement, 'pointerup', this.upEvt.bind(this));
    this.listenFunc4 = this.renderer.listen(this.el.nativeElement, 'pointerout', this.upEvt.bind(this));

  }

  moveEvt(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();

    const dx = evt.clientX - this.pos.x;
    const dy = evt.clientY - this.pos.y;

    // Scroll the element
    this.el.nativeElement.scrollTop = this.pos.top - dy;
    this.el.nativeElement.scrollLeft = this.pos.left - dx;
  }

  upEvt(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();
    this.cursor = 'grab';

    // move, out, up event listener 제거
    this.listenFunc2();
    this.listenFunc3();
    this.listenFunc4();
  }

}
