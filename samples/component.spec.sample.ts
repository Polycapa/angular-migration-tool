import { $component } from '$componentFile';
import { $module } from '$moduleFile';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
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
describe('$mainTitle', function () {

  let fixture: ComponentFixture<$component>;
  let component: $component;
  let debugElement: DebugElement;

  $body

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        // I18N
        //   TranslateModule.forRoot({
        //     loader: {
        //       provide: TranslateLoader,
        //       useFactory: HttpLoaderFactory,
        //       deps: [HttpClient]
        //     }
        //   }),
        //   HttpClientModule,
        // END I18N
        $module
      ],
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

  beforeEach(() => {
    fixture = TestBed.createComponent($component);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;
  })

  $content
});
