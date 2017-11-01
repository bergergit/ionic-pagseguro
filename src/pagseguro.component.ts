import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { PagSeguroService } from './pagseguro.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
//import * as moment from 'moment';
import moment from 'moment';

declare var PagSeguroDirectPayment: any;
 
@Component({
  selector: 'pagseguro-component',
  templateUrl: 'pagseguro.component.html',
  styleUrls: ['pagseguro.style.css']
})
export class PagSeguroComponent implements OnInit {
 
  @Output() checkout:EventEmitter<string> = new EventEmitter();

  DATE_FORMAT = 'YYYY-MM-DD';
  paymentMethods;
  private sessionId: number;
  public cardBrand: any;
  public paymentForm: FormGroup;
  public processing = false;

  dateMax: string;
  dateMin: string;
 

  constructor(private pagSeguroService: PagSeguroService, private formBuilder: FormBuilder) {

    this.dateMin = moment().format(this.DATE_FORMAT);
    this.dateMax = moment().add(20, 'years').format(this.DATE_FORMAT);
    
  }   

  ngOnInit() {  
    this.initFormCard(); 
    this.pagSeguroService.setForm(this.paymentForm);
    this.pagSeguroService.restoreCheckoutData();
    // carrega o .js do PagSeguro
    this.pagSeguroService.loadScript().then(_ => {
      //this.pagSeguroService.startSession().subscribe(result => {
      this.pagSeguroService.startSession().then(response => {
        let result = response.json();
        this.sessionId = result.session.id;
        PagSeguroDirectPayment.setSessionId(this.sessionId);

        // recupera as opçoes de pagamento
        this.pagSeguroService.getPaymentMethods(100).then(response => {
          //console.debug('paymentMethods', response);
          this.paymentMethods = response.paymentMethods;
        }).catch(error => {
          console.error('error', error);
        });
      }).catch(error => {
        console.error('Erro ao iniciar sessao', error);
      });
    });
  }

  /**
   * Inicializar o FormGroup usado para recuperar as informações do usuário
   */
  initFormCard() {
    // this.pagSeguroService.checkoutData.sender.name
    this.paymentForm = this.formBuilder.group({
      paymentMethod: ['creditCard'],
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
      }),
      phone: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(11)]],
      birthDate: ['', [Validators.required]]

    });

    
  }

  initFormBoleto() {
    this.paymentForm = this.formBuilder.group({
      paymentMethod: ['boleto'],
      phone: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(11)]]
    });
  }

  paymentOptionChanged() {
    if (this.paymentForm.value.paymentMethod === 'boleto') {
      this.initFormBoleto();
    } else {
      this.initFormCard();
    }
    console.debug('restoring form', this.paymentForm);
    this.pagSeguroService.setForm(this.paymentForm);
    this.pagSeguroService.restoreCheckoutData();
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
   * Se tivermos um evento de (checkout) definido pelo Component pai, apenas invocamos esse evento
   * Senao, invocamos a funçao interna de checkout do component
   */
  public doCheckout() {
    this.processing = true;
    if (this.checkout) {
      this.checkout.emit('checkout');
      this.processing = false;
    } 
  }

  fetchZip(zip) {
    this.pagSeguroService.fetchZip(zip).then(address => {
      if (address) {
        this.pagSeguroService.patchAddress(this.pagSeguroService.matchAddress(address.json()).creditCard.billingAddress, true);
      }
    });
  }

  


}
