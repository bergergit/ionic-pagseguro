import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagSeguroComponent } from './pagseguro.component';
import { PagSeguroService } from './pagseguro.service';
import { PagseguroCurrencyFormatPipe } from './pagseguro.currency-format';
import { IonicModule } from 'ionic-angular';
import { Utils } from './utils';

export * from './pagseguro.component'; 
export * from './pagseguro.service';
export * from './pagseguro.options'; 
export * from './pagseguro.data';
export * from './pagseguro.currency-format';
 
@NgModule({
  imports: [
    CommonModule,
    IonicModule
  ],
  declarations: [
    PagSeguroComponent,
    PagseguroCurrencyFormatPipe
  ],
  providers: [
    Utils
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

  static forChild(): ModuleWithProviders {
    return { 
      ngModule: PagSeguroModule
    };
  }
}
