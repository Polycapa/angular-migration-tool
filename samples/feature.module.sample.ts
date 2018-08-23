import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
// I18N
// import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
// import { TranslateHttpLoader } from '@ngx-translate/http-loader';
// import { HttpClient, HttpClientModule } from '@angular/common/http';
// END I18N
$import

// I18N
// export function HttpLoaderFactory(http: HttpClient) {
//     return new TranslateHttpLoader(http);
// }
// END I18N


@NgModule({
  imports: [
    CommonModule,
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
    $declarations
  ],
  exports: [
    $exports
  ]
})
export class $moduleName { }
