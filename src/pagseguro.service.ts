import { Injectable } from '@angular/core';
import { PagSeguroDefaultOptions } from './pagseguro.defaults';
import { RequestOptions, Http, Headers, Response } from '@angular/http';
import { PagSeguroOptions } from './pagseguro.options';
import { Observable } from "rxjs/Observable";
import 'rxjs/add/operator/map';


declare var PagSeguroDirectPayment:any;

@Injectable()
export class PagSeguroService {

  private scriptLoaded: boolean;
  private options: PagSeguroOptions;

  constructor(private http: Http) {
    this.options = PagSeguroDefaultOptions;
  }

  public setOptions(options: PagSeguroOptions) {
    this.options = Object.assign(PagSeguroDefaultOptions, options);
  }

  /**
   * Carrega o <script> do PagSeguro no HEAD do documento
   */
  public loadScript(): Promise<any> {
    //console.debug('Will load options with URL', this.options.scriptURL);
    var promise = new Promise((resolve) => {
      if (this.options.loadScript && !this.scriptLoaded) {
          let script: HTMLScriptElement = document.createElement('script');
          script.addEventListener('load', r => resolve());
          script.src = this.options.scriptURL;
          document.head.appendChild(script);

        //BUSCA UM ID DE SESSÃO NO SERVIDOR (ESTE ID É GERADO PELA API DO PAGSEGURO QUE VOCÊ DEVE CONSUMIR USANDO SEU SERVIDOR. LER DOCUMENTAÇÃO PARA SABER COMO GERAR)
        //this.pagamentoService.startSession().subscribe(result => PagSeguroDirectPayment.setSessionId(result));

        this.scriptLoaded = true;
      } else {
        console.debug('Script is already loaded. Skipping...');
        resolve();
      }
    });
    return promise;
  }

  
  public startSession() {

    let headers = new Headers({ 'Content-Type': 'application/json' });
    let requestOptions = new RequestOptions({ headers: headers });

    return this.http.get(this.options.sessionURL, requestOptions).map((res:Response) => res.json());
    
  }

  /*

  public store(dados: Dados) {

    let headers = new Headers({ 'Content-Type': 'application/json' });
    let options = new RequestOptions({ headers: headers });

    let body = JSON.stringify({ dados });
    return this.http.post('http://www.suaApi.com.br/store', body, options)
      .map(res => res.json());
  }

  public cancel() {

    let headers = new Headers({ 'Content-Type': 'application/json' });
    let options = new RequestOptions({ headers: headers });

    return this.http.get('http://www.suaApi.com.br/cancel', options)
      .map(res => res.json());
  }
  */


}
