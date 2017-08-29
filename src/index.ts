import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagSeguroComponent } from './pagseguro.component';
import { PagSeguroService } from './pagseguro.service';
import { IonicModule } from 'ionic-angular';
import { Utils } from './utils';

export * from './pagseguro.component'; 
export * from './pagseguro.service';
export * from './pagseguro.options'; 
export * from './pagseguro.data';

//export * from './pagseguro.directive'; 

@NgModule({
  imports: [
    CommonModule,
    IonicModule

  ],
  declarations: [
    PagSeguroComponent
  ],
  providers: [
    Utils,
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
