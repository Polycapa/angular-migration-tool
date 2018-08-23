import { TestBed } from '@angular/core/testing';
import { BaseRequestOptions, Http } from '@angular/http';
import { MockBackend } from '@angular/http/testing';
// I18N
// import { HttpClient, HttpClientModule } from '@angular/common/http';
// import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
// import { TranslateHttpLoader } from '@ngx-translate/http-loader';
// END I18N

// I18N
// export function HttpLoaderFactory(http: HttpClient) {
//   return new TranslateHttpLoader(http);
// }
// END I18N
$imports

describe('$mainTitle', function () {

  $body

  beforeEach(() => {
    TestBed.configureTestingModule({
      // I18N
      // imports: [
      //   TranslateModule.forRoot({
      //     loader: {
      //       provide: TranslateLoader,
      //       useFactory: HttpLoaderFactory,
      //       deps: [HttpClient]
      //     }
      //   }),
      //   HttpClientModule,
      // ],
      // END I18N
      providers: [
        MockBackend,
        BaseRequestOptions,
        {
          provide: Http,
          useFactory: (backend: MockBackend, options: BaseRequestOptions) => new Http(backend, options),
          deps: [MockBackend, BaseRequestOptions]
        }
      ]
    });
  });

  $content
});
