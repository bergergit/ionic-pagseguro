import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { PagSeguroService } from './pagseguro.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
//import * as moment from 'moment';
import moment from 'moment';
import { Subscription } from 'rxjs/Subscription';
//import { Utils } from './utils';
import { IMyDpOptions } from 'mydatepicker';
import { Platform } from 'ionic-angular';
import { IMyDate } from 'mydatepicker';

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
  installments: any;
  private amountSubscription: Subscription;
  private amount: number; 

  dateMax: string;
  dateMin: string;
  expirationMonths: string[] = [];
  expirationYears: string[] = [];

  public myDatePickerOptions: IMyDpOptions; 
 
  constructor(private pagSeguroService: PagSeguroService, private formBuilder: FormBuilder, public platform: Platform) {

    this.dateMin = moment().format(this.DATE_FORMAT);
    this.dateMax = moment().add(30, 'years').format(this.DATE_FORMAT);

    this.myDatePickerOptions = {
      editableDateField: false,
      showTodayBtn: false,
      openSelectorOnInputClick: true,
      showClearDateBtn: false,
    }
  }   

  ngOnInit() {  
    this.initFormCard(); 
    this.initExpirationDates();
    this.pagSeguroService.setForm(this.paymentForm);
    this.pagSeguroService.restoreCheckoutData();
    this.amountSubscription = this.pagSeguroService.amount$.subscribe(amount => {
      this.amount = amount;
      this.fetchInstallments();
    }); 

    // carrega o .js do PagSeguro
    this.pagSeguroService.loadScript().then(_ => {
      //this.pagSeguroService.startSession().subscribe(result => {
      this.pagSeguroService.startSession().then(response => {
        let result = response.json();
        this.sessionId = result.session.id;
        PagSeguroDirectPayment.setSessionId(this.sessionId);

        // recupera as opçoes de pagamento
        this.pagSeguroService.getPaymentMethods(this.amount || 100).then(response => {
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
 
  ngOnDestroy() {
    if (this.amountSubscription) {
      this.amountSubscription.unsubscribe();
    }
  }

  /**
   * Adiciona os meses e anos de expiração
   */
  initExpirationDates() {
    for (let month = 1; month <= 12; month++) {
      this.expirationMonths.push(this.pad(month));
    }
    for (let year = 0; year <= 30; year++) {
      this.expirationYears.push(moment().add(year, 'years').format('YYYY'));
    }
  }

  public pad(d: number) {
    return (d < 10) ? '0' + d.toString() : d.toString();
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
        month: ['', [Validators.required]],
        year: ['', [Validators.required]],
        installments: ['', [Validators.required]],
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
      ionBirthDate: [moment().subtract(18, 'years').month(0).date(1).format(this.DATE_FORMAT)],
      mydpBirthdate: [{ date: this.convertToDatePicker(moment().subtract(18, 'years').month(0).date(1)) }]
    });
  }

  public convertToDatePicker(date: moment.Moment): IMyDate {
    return { year: date.year(), month: date.month() + 1, day: date.date() };
  }


  initFormBoleto() {
    this.paymentForm = this.formBuilder.group({
      paymentMethod: ['boleto'],
      cpf: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(11)]]
    });
  }

  paymentOptionChanged() {
    if (this.paymentForm.value.paymentMethod === 'boleto') {
      this.initFormBoleto();
    } else {
      this.initFormCard();
    }
    //console.debug('restoring form', this.paymentForm);
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
          this.fetchInstallments();
        }).catch(error => {
          this.paymentForm.controls['card'].setErrors({ 'cardNumber': true });
        });
      }
    } else {
      this.cardBrand = null;
    }
  } 

  fetchInstallments() {
    this.installments = 0;
    this.paymentForm.patchValue({card: {installments: ''}});
    if (this.cardBrand) {
      this.pagSeguroService.getInstallments(this.amount, this.cardBrand.name, 6).then(result => {
        this.installments = result.installments[this.cardBrand.name];
        this.paymentForm.patchValue({
          card: {
            installments: this.installments[0].quantity
          }
        });
      }).catch(error => {
        console.error('error getting installments', error);
        this.paymentForm.controls['card'].setErrors({ 'installments': true });
      });
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
    this.pagSeguroService.fetchZip(zip, true);
  }

  


}
