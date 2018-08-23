import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: '$name' })
export class $className implements PipeTransform {

  constructor(
    $injections
  ) { }

  transform($params) {
    $body
  }
}
