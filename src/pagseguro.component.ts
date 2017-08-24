import { Component, OnInit } from '@angular/core';
import { PagSeguroService } from './pagseguro.service';
import { PagSeguroOptions } from "./pagseguro.options";

declare var PagSeguroDirectPayment:any;

@Component({
  selector: 'pagseguro-component',
  template: `<h1>PAGSEGURO!</h1>`
})
export class PagSeguroComponent implements OnInit {
  
  private options: PagSeguroOptions;

  constructor(private pagSeguroService: PagSeguroService) {
  }

  async ngOnInit() {
    // carrega o .js do PagSeguro
    await this.pagSeguroService.loadScript().then(_ => {
      this.pagSeguroService.startSession().subscribe(result => PagSeguroDirectPayment.setSessionId(result.session.id));
    });

    // adquire um ID de sessao
  }


  initializeComponent() {
    this.pagSeguroService.loadScript();
  }

}
