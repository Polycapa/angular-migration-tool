import { Directive, ElementRef, Injector, Input } from '@angular/core';
import { UpgradeComponent } from '@angular/upgrade/static';

@Directive({
  selector: '$selector'
})
export class $componentClass extends UpgradeComponent {
  $inputs

  constructor(elementRef: ElementRef, injector: Injector) {
    super('$componentName', elementRef, injector);
  }
}
