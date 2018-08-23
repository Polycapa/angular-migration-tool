import { Component, Input, OnInit } from '@angular/core';
import { UpgradeModule } from '@angular/upgrade/static';
// I18N
// import { TranslateService } from '@ngx-translate/core';
// END I18N

@Component({
  selector: '$appComponentSelector',
  template: '<div class="view-wrapper" ng-view=""></div>'
})
export class AppComponent implements OnInit {
  constructor(
    private upgrade: UpgradeModule,
    // I18N
    // private translate: TranslateService
    // END I18N
  ) {
    // I18N
    // translate.setDefaultLang('$i18nDefaultLanguage');
    // translate.use('$i18nDefaultLanguage');
    // END I18N
  }

  ngOnInit() {
    this.upgrade.bootstrap(document.documentElement, ['$moduleName'], { strictDi: true })
  }
}
