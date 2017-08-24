import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagSeguroComponent } from './pagseguro.component';
import { PagSeguroService } from './pagseguro.service';

export * from './pagseguro.component';
export * from './pagseguro.service';
export * from './pagseguro.options';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    PagSeguroComponent
  ],
  exports: [
    PagSeguroComponent
  ]
})
export class PagSeguroModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: PagSeguroModule,
      providers: [PagSeguroService]
    };
  }
}
