import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { UpgradeModule } from '@angular/upgrade/static';
import { AppComponent } from './app.component';
// ROUTING
// import { RouterModule, Routes, UrlHandlingStrategy } from "@angular/router";
// END ROUTING
// I18N
// import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
// import { TranslateHttpLoader } from '@ngx-translate/http-loader';
// import { HttpClient, HttpClientModule } from '@angular/common/http';
// END I18N

// ROUTING
// const appRoutes: Routes = $routes;
// export class Ng1Ng2UrlHandlingStrategy implements UrlHandlingStrategy {
//     shouldProcessUrl(url) {
//         return $urlStartsWith;
//     }
//     extract(url) { return url; }
//     merge(url, whole) { return url; }
// }
// END ROUTING
// I18N
// export function HttpLoaderFactory(http: HttpClient) {
//     return new TranslateHttpLoader(http);
// }
// END I18N


@NgModule({
  imports: [
    BrowserModule,
    UpgradeModule,
    // ROUTING
    // RouterModule.forRoot(appRoutes),
    // END ROUTING
    // I18N
    // TranslateModule.forRoot({
    //     loader: {
    //         provide: TranslateLoader,
    //         useFactory: HttpLoaderFactory,
    //         deps: [HttpClient]
    //     }
    // }),
    // HttpClientModule,
    // END I18N
  ],
  declarations: [
    AppComponent
  ],
  providers: [
    // ROUTING
    // { provide: UrlHandlingStrategy, useClass: Ng1Ng2UrlHandlingStrategy }
    // END ROUTING
  ],
  entryComponents: [
    AppComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor() { }
}