import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[$selector]'
})
export class $directiveName {
  $properties
  constructor(
    private el: ElementRef,
    $injections
  ) { }

  $functions
}
