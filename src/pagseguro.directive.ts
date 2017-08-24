import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[pagSeguroDirective]'
})
export class PagSeguroDirective {

  constructor(private el: ElementRef) {
  }

}
