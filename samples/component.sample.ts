import { Component, Input, OnInit, DoCheck } from '@angular/core';
// DOWNGRADE
// declare var angular: any;
// import { downgradeComponent } from '@angular/upgrade/static';
// END DOWNGRADE

@Component({
  selector: '$selector',
  styleUrls: ['$styleUrl'],
  templateUrl: '$templateUrl'
})
export class $componentName implements OnInit, DoCheck {
  $inputs

  $properties

  constructor(
    $injections
  ) { }

  public ngOnInit() {
  }

  ngDoCheck(): void {
    $doCheck
  }

  $functions

  $todo
}

// DOWNGRADE
// angular.module('$moduleName')
//     .directive(
//         '$componentName',
//         downgradeComponent({ component: $ComponentClass })
//     );
// END DOWNGRADE
