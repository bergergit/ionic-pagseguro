import { Injectable } from '@angular/core';
import { PagSeguroDefaultOptions } from './pagseguro.defaults';
import { RequestOptions, Http, Headers } from '@angular/http';
import { PagSeguroOptions } from './pagseguro.options';
//import { Observable } from "rxjs/Observable";

import { PagSeguroData } from './pagseguro.data';
import { FormGroup } from '@angular/forms';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';
import { Observable } from 'rxjs/Observable';
import { Platform } from 'ionic-angular';
 
declare var PagSeguroDirectPayment: any;

@Injectable() 
export class PagSeguroService {

  //private ZIP_URL = 'https://viacep.com.br/ws';
  private ZIP_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

  private scriptLoaded: boolean;
  private options: PagSeguroOptions;
  public creditCardHash;
  private checkoutData: PagSeguroData;
  private paymentForm: FormGroup;
  private apiKey: string;
  private amountSource: BehaviorSubject<number>;
  public amount$: Observable<number>;
  private maxInstallmentNoInterest: number;
  installments: any;

  constructor(private http: Http, public platform: Platform) {
    this.options = PagSeguroDefaultOptions;
    this.amountSource = new BehaviorSubject<number>(0);
    this.amount$ = this.amountSource.asObservable();
  }

  public setOptions(options: PagSeguroOptions) {
    this.options = Object.assign(PagSeguroDefaultOptions, options);
  }

  public getOptions(): PagSeguroOptions {
    return this.options;
  }

  public setForm(paymentForm: FormGroup) {
    this.paymentForm = paymentForm;
  }

  public setAmount(amount: number) {
    this.amountSource.next(amount);
  }

  // public getAmount(): number {
  //   return this.amount;
  // }

  public getSelectedPaymentMethod(): string {
    return this.paymentForm.value.paymentMethod;
  }

  /**
   * Carrega o <script> do PagSeguro no HEAD do documento
   */
  public loadScript(): Promise<any> {
    var promise = new Promise((resolve) => {
      if (this.options.loadScript && !this.scriptLoaded) {
        let script: HTMLScriptElement = document.createElement('script');
        script.addEventListener('load', r => resolve());
        script.src = this.options.scriptURL;
        document.head.appendChild(script);

        this.scriptLoaded = true;
      } else {
        console.debug('Script is already loaded. Skipping...');
        resolve();
      }
    });
    return promise;
  }


  /**
   * Inicia a sessao com o PagSeguro, invocando uma Firebase Function
   */
  //public startSession(): Observable<any> {
  public startSession(): Promise<any> {

    let headers = new Headers({ 'Content-Type': 'application/json' });
    let requestOptions = new RequestOptions({ headers: headers });

    //return this.http.get(this.options.remoteApi.sessionURL, requestOptions).map((res: Response) => res.json());
    return this.http.get(this.options.remoteApi.sessionURL, requestOptions).toPromise();
  }

  /**
   * Recupera as opções de pagamento. 
   * Esta funcção deve ser chamada após já termos iniciado a sessão, pelo startSession()
   */
  public getPaymentMethods(amount: number): Promise<any> {
    var promise = new Promise((resolve, reject) => {
      // recupera as opçoes de pagamento através da API Javscript do PagSeguro
      PagSeguroDirectPayment.getPaymentMethods({
        amount: amount,
        success: function (response) {
          resolve(response);
        },
        error: function (response) {
          reject(response);
        }
      });
    });
    return promise;
  }

  public getInstallments(amount: number, brand: string, maxInstallmentNoInterest: number): Promise<any> {
    this.maxInstallmentNoInterest = maxInstallmentNoInterest;
    var that = this;
    var promise = new Promise((resolve, reject) => {
      PagSeguroDirectPayment.getInstallments({
        amount: amount,
        brand: brand,
        maxInstallmentNoInterest: maxInstallmentNoInterest,
        success: function (response) {
          that.installments = response.installments[brand];
          resolve(response);
        },
        error: function (response) {
          reject(response);
        },
      });
    });

    return promise;

  }

  /**
   * Recupera a bandeira do cartão através dos 6 primeiros numeros do cartão (PIN)
   */
  public getCardBrand(pin: string): Promise<any> {
    var promise = new Promise((resolve, reject) => {
      PagSeguroDirectPayment.getBrand({
        cardBin: pin,
        success: function (response) {
          resolve(response);
        },
        error: function (response) {
          reject(response);
        }
      });
    });
    return promise;
  }

  public removeCheckoutData() {
    this.checkoutData = null;
  }


  /**
   * Use esta função para definir os itens e valores que devem entrar no checkout do PagSeguro
   * @param data 
   */
  public addCheckoutData(data: PagSeguroData, skipPatchForm?: boolean) {
    this.checkoutData = Object.assign(this.checkoutData || {}, data);
    //this.checkoutData = Object.assign(data, this.checkoutData || {});

    if (!skipPatchForm) {

      // adiciona alguns campos no próprio formulario de checkout
      if (this.checkoutData && this.checkoutData.sender && this.paymentForm) {

        if (this.checkoutData.sender.name && this.paymentForm.value.card && !this.paymentForm.value.card.name) {
          this.paymentForm.patchValue({
            card: {
              name: this.checkoutData.sender.name
            }
          });
        }

        if (this.checkoutData.sender.documents && this.checkoutData.sender.documents.document.type === 'CPF' && this.paymentForm.value.card && !this.paymentForm.value.card.cpf) {
          this.paymentForm.patchValue({
            card: {
              cpf: this.checkoutData.sender.documents.document.value
            }
          });
        }


        if (this.checkoutData.sender.phone && !this.paymentForm.value.phone) {
          this.paymentForm.patchValue({
            phone: this.checkoutData.sender.phone.areaCode + this.checkoutData.sender.phone.number
          })
        }
      }

      if (this.checkoutData && this.checkoutData.creditCard && this.checkoutData.creditCard.billingAddress) {
        this.patchAddress(this.checkoutData.creditCard.billingAddress, true);
      }
    }

  }

  public restoreCheckoutData() {
    this.addCheckoutData(this.checkoutData);
  }

  public patchAddress(address, force?: boolean) {
    if (this.paymentForm && (!this.paymentForm.value.address || force)) {
      this.paymentForm.patchValue({
        address: address
      });
    }
  }


  /**
   * Converte do formato ISO (yyyy-MM-dd) para o formato do PagSeguro que é: dd/MM/yyyy
   * @param isoDate 
   */
  private convertIsoDate(): string {
    if (this.platform.is('core')) {
      return this.paymentForm.value.mydpBirthdate.formatted;
    } else {
      let isoDate = this.paymentForm.value.ionBirthDate;
      var ptrn = /(\d{4})\-(\d{2})\-(\d{2})/;
      if (!isoDate || !isoDate.match(ptrn)) {
        return null;
      }
      return isoDate.replace(ptrn, '$3/$2/$1');
    }
  }

  /**
   * Recupera o valor da parcela individual para a quantidade de parcelas selecionadas
   */
  private getAmountForInstallmentQuantity(quantity) {
    for (let i = 0; i < this.installments.length; i++) {
      if (this.installments[i].quantity == quantity) return this.installments[i].installmentAmount.toFixed(2);
    }
    return '0.00';
  } 

  /**  
   * Monta o objeto necessário para a API do PagSeguro
   */
  buildPagSeguroData(): PagSeguroData {
    let data: PagSeguroData = {
      method: this.paymentForm.value.paymentMethod,
      shipping: {
        addressRequired: false
      }, 

      sender: {
        phone: {
          areaCode: this.paymentForm.value.phone.substring(0, 2),
          number: this.paymentForm.value.phone.substring(2)
        },
        documents: {
          document: {
            type: 'CPF',
            value: this.paymentForm.value.cpf || this.paymentForm.value.card.cpf
          }
        }
      }
    }

    if (this.paymentForm.value.paymentMethod == 'creditCard') {
      let cardData: PagSeguroData = {
        creditCard: {
          cardNumber: this.paymentForm.value.card.cardNumber,
          cvv: this.paymentForm.value.card.cvv,
          expirationMonth: this.paymentForm.value.card.month,
          expirationYear: this.paymentForm.value.card.year,
          billingAddress: this.paymentForm.value.address,
          installment: {
            quantity: this.paymentForm.value.card.installments,
            noInterestInstallmentQuantity: this.maxInstallmentNoInterest,
            value: this.getAmountForInstallmentQuantity(this.paymentForm.value.card.installments)
          },
          holder: {
            name: this.paymentForm.value.card.name,
            documents: {
              document: {
                type: 'CPF',
                value: this.paymentForm.value.card.cpf
              }
            },
            phone: {
              areaCode: this.paymentForm.value.phone.substring(0, 2),
              number: this.paymentForm.value.phone.substring(2)
            },
            birthDate: this.convertIsoDate()
          }
        }
      }

      data = Object.assign(data, cardData);
    }
    
    return data;
  }



  /**
   * Função que realiza o pagamento com o PagSeguro.
   * Ela irá passar os dados resgatados, para uma Firebase Functio, que irá concluir o processo
   * 
   * @param data 
   */
  public checkout(): Promise<any> {
    let data: PagSeguroData = this.buildPagSeguroData();
    
    if (this.paymentForm && this.paymentForm.value.card && this.paymentForm.value.card.name) {
      data.sender.name = this.paymentForm.value.card.name;
    } else {
      data.sender.name = this.checkoutData.sender.name;
    }

    data.sender.email = this.checkoutData.sender.email;
    

    console.debug('built data',  data);
    console.debug('checkoutData',  data);

    data = Object.assign(this.checkoutData, data);

    

    console.debug('built checkoutData after mix',  data);

    if (data.method === 'creditCard') {
      //data.sender.documents = data.creditCard.holder.documents;
      // recupera o token do cartao de crédito
      data.sender.hash = PagSeguroDirectPayment.getSenderHash();
      return this.createCardToken(data).then(result => {
        data.creditCard.token = result.card.token;

        // removendo dados nao necessarios do cartao
        delete (data.creditCard.cardNumber);
        delete (data.creditCard.cvv);
        delete (data.creditCard.expirationMonth);
        delete (data.creditCard.expirationYear);

        return this._checkout(data);
      });
    } else {
      data.sender.hash = PagSeguroDirectPayment.getSenderHash();
      return this._checkout(data);
    }
  }

  /**
   * Invoca a API do Firebase Function com todos os dados necessários
   * Essa API deverá chamar a função de /transactions do PagSeguro para concluir a transação
   * @param data
   */
  private _checkout(data: PagSeguroData): Promise<any> {
    console.debug('invocando a API com os dados.', data);
    var headers = new Headers();
    headers.append('Content-Type', 'application/json');
    if (data.token) headers.append('Authorization', 'Bearer ' + data.token);

    let requestOptions = new RequestOptions({ headers: headers });

    return this.http.post(this.options.remoteApi.checkoutURL, JSON.stringify(data), requestOptions).toPromise();
  } 

  /**
   * Cria um Token para o cartão de crédito informado
   * @param data 
   */
  public createCardToken(data: PagSeguroData): Promise<any> {
    var promise = new Promise((resolve, reject) => {
      PagSeguroDirectPayment.createCardToken({
        cardNumber: data.creditCard.cardNumber,
        cvv: data.creditCard.cvv,
        expirationMonth: data.creditCard.expirationMonth,
        expirationYear: data.creditCard.expirationYear,
        success: function (response) {
          resolve(response);
        }, 
        error: function (response) {
          reject(response);
        }
      });
    });
    return promise;
  }

  /**
   * Tenta extrair o tipo de campo, a partir de um resultado do Google API
   * https://developers.google.com/maps/documentation/geocoding/intro
   * 
   * @param results 
   */
  public extractField(field: string, results) {
    for (let i = 0; i < results.address_components.length; i++) {
      let addressComponent = results.address_components[i];
      if (addressComponent.types && addressComponent.types.indexOf(field) !== -1) {
        return addressComponent.short_name;
      }
    }
    return '';
  }

  /**
   * Fetches zip code information. (works for Brazil)
   * @param zip 
   */
  public fetchZip(zip: string, addToCheckoutData: boolean): Promise<any> {
    //return this.httpClient.get<any>(`${this.ZIP_URL}/${zip}/json`).retry(2);
    //return this.http.get(`${this.ZIP_URL}/${zip}/json`).toPromise();
    let addressPromise = this.http.get(`${this.ZIP_URL}?address=${zip}&language=pt-BR&region=br&key=${this.apiKey}`).map((res) => res.json()).toPromise();
    addressPromise.then((info) => {
      if (addToCheckoutData && info.results && info.results[0]) {
        //this.pagSeguroService.addCheckoutData(this.pagSeguroService.matchAddress(info.results[0]));
        this.matchAddress(info.results[0]);
      }
    });

    return addressPromise;
  }

  public fetchLatLong(location): Promise<any> {
    //return this.httpClient.get<any>(`${this.ZIP_URL}/${zip}/json`).retry(2);
    //return this.http.get(`${this.ZIP_URL}/${zip}/json`).toPromise();
    return this.http.get(`${this.ZIP_URL}?latlng=${location.lat},${location.lng}&language=pt-BR&key=${this.apiKey}`).map((res) => res.json()).toPromise();
  }

  /**
   * Permite que o cliente defina a API KEY do Google
   */
  public setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Faz um match dos dados retornados pelo Viacep, com o formato necessário para o PagSeguro
   * @param address
   */
  public matchAddress(address: any) {
    if (address) {
      this.fetchLatLong(address.geometry.location).then(detailedAddressResult => {
        let detailedAddress = detailedAddressResult.results && detailedAddressResult.results[0] || null;

        let addressData: PagSeguroData = {
          creditCard: {
            billingAddress: {
              // state: address.uf,
              // country: 'BRA',
              // postalCode: address && address.cep ? address.cep.replace('-', '') : '',
              // number: '',
              // city: address.localidade,
              // street: address.logradouro,
              // district: address.bairro 

              state: this.extractField('administrative_area_level_1', address),
              country: 'BRA',
              postalCode: this.extractField('postal_code', address).replace('-', ''),
              number: '',
              city: this.extractField('administrative_area_level_2', address),
              street: detailedAddress ? this.extractField('route', detailedAddress) : '',
              district: this.extractField('sublocality_level_1', address)
            }
          }
        }
        this.addCheckoutData(addressData);
        //return addressData;
      });
    }
    //return null;

  }

}
