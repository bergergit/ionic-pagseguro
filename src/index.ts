import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagSeguroComponent } from './pagseguro.component';
import { PagSeguroService } from './pagseguro.service';
import { IonicModule } from 'ionic-angular';
import ptBr from '@angular/common/locales/pt';
import ptBrExtra from '@angular/common/locales/extra/pt';
import { registerLocaleData } from '@angular/common';
import { MyDatePickerModule } from 'mydatepicker';
registerLocaleData(ptBr, ptBrExtra);

export * from './pagseguro.component'; 
export * from './pagseguro.service';
export * from './pagseguro.options'; 
export * from './pagseguro.data';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    MyDatePickerModule
  ],
  declarations: [
    PagSeguroComponent
  ],
  providers: [
    
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
