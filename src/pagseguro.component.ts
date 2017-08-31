import { Component, OnInit } from '@angular/core';
import { PagSeguroService } from './pagseguro.service';
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { PagSeguroData } from './pagseguro.data';
//import { PagSeguroOptions } from "./pagseguro.options";
import { Utils } from './utils';
     
declare var PagSeguroDirectPayment: any;

@Component({
  selector: 'pagseguro-component',
  templateUrl: 'pagseguro.component.html',
  styleUrls: ['pagseguro.style.css']
})
export class PagSeguroComponent implements OnInit {

  //private options: PagSeguroOptions;
  paymentMethods;
  private sessionId: number;
  public cardBrand: any;
  public paymentForm: FormGroup;
  public processing = false;

  constructor(private pagSeguroService: PagSeguroService, private formBuilder: FormBuilder, public utils: Utils) {
    
  }   

  async ngOnInit() {  
    this.initForm(); 
    this.pagSeguroService.setForm(this.paymentForm);
    // carrega o .js do PagSeguro
    await this.pagSeguroService.loadScript().then(_ => {
      //this.pagSeguroService.startSession().subscribe(result => {
      this.pagSeguroService.startSession().then(response => {
        let result = response.json();
        this.sessionId = result.session.id;
        PagSeguroDirectPayment.setSessionId(this.sessionId);

        // recupera as opçoes de pagamento
        this.pagSeguroService.getPaymentMethods(100).then(response => {
          console.debug('paymentMethods', response);
          this.paymentMethods = response.paymentMethods;
        }).catch(error => {
          console.debug('error', error);
        });
      }).catch(error => {
        console.error('Erro ao iniciar sessao', error);
      });
    });
  }

  /**
   * Inicializar o FormGroup usado para recuperar as informações do usuário
   */
  initForm() {
    // this.pagSeguroService.checkoutData.sender.name
    this.paymentForm = this.formBuilder.group({
      paymentMethod: ['card'],
      card: this.formBuilder.group({
        cardNumber: ['', [Validators.required, Validators.maxLength(16)]],
        name: ['', [Validators.required]],
        validity: ['', [Validators.required]],
        cvv: ['', [Validators.required, Validators.minLength(3)]],
        cpf: ['', [Validators.required]]
      }),
      address: this.formBuilder.group({
        state: [''],
        country: [''],
        postalCode: ['', [Validators.required]],
        number: ['', [Validators.required]],
        city: [''],
        street: ['', [Validators.required]],
        district: ['']
      })
    });
  } 

  initializeComponent() {
    this.pagSeguroService.loadScript();
  }

  /**
   * Recupera a bandeira do cartão, ao se digitar os primeiros 6 numeros
   */
  getBrand() {
    if (this.paymentForm.value.card.cardNumber.length >= 6) {
      if (!this.cardBrand) {
        this.pagSeguroService.getCardBrand(this.paymentForm.value.card.cardNumber).then(result => {
          this.cardBrand = result.brand;
          console.debug('card brand is now', this.cardBrand);
        }).catch(error => {
          this.paymentForm.controls['card'].setErrors({ 'number': true });
        });
      }
    } else {
      this.cardBrand = null;
    }
  }

  /**
   * Imagem da bandeira do cartao
   */
  getCardImage() {
    if (this.paymentMethods && this.cardBrand) {
      return this.pagSeguroService.getOptions().filesURL + this.paymentMethods.CREDIT_CARD.options[this.cardBrand.name.toUpperCase()].images.SMALL.path;
    } else {
      return '';
    }
  }

  /**
   * Nome da bandeira do cartao
   */
  getCardDisplayName() {
    if (this.paymentMethods && this.cardBrand) {
      return this.paymentMethods.CREDIT_CARD.options[this.cardBrand.name.toUpperCase()].displayName;
    } else {
      return '';
    } 
  }

  /**
   * Invoca o checkout do PagSeguro
   */
  public checkout() {
    this.processing = true;
    this.utils.executePromiseWithMessage(this.pagSeguroService.checkout(this.buildPagSeguroData()), true, "Processando pagamento...").then(result => {
      this.processing = false;
      console.debug('checkout result', result);
    }).catch(error => {
      this.processing = false;
      console.error('Erro no checkout', error);
      if (error.status == 401) {
        this.utils.showErrorAlert("Erro ao processar o pagamento", "Pagamento não autorizado");
      } else {
        this.utils.showErrorAlert("Erro ao processar o pagamento", JSON.stringify(error.errors || error.statusText));
      }
      
    });
  }

  fetchZip(zip) {
    console.debug('fetching zip for', zip);
    this.pagSeguroService.fetchZip(zip).subscribe(address => {
      if (address) {
        console.debug('got address', address);
        this.pagSeguroService.patchAddress(this.pagSeguroService.matchAddress(address).creditCard.billingAddress);
      }
    });
  }

  /**
   * Monta o objeto necessário para a API do PagSeguro
   */
  buildPagSeguroData(): PagSeguroData {
    let data: PagSeguroData = {
      method: 'creditCard',
      shipping: {
        addressRequired: false
      },
      creditCard: {
        cardNumber: this.paymentForm.value.card.cardNumber,
        cvv: this.paymentForm.value.card.cvv,
        expirationMonth: this.paymentForm.value.card.validity.substring(5),
        expirationYear: this.paymentForm.value.card.validity.substring(0, 4),
        billingAddress: this.paymentForm.value.address,
        holder: {
          name: this.paymentForm.value.card.name,
          documents: {
            document: {
              type: 'CPF',
              value: this.paymentForm.value.card.cpf
            }
          }
        }
      }
    }
    return data;
  }


}
