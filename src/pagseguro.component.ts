import { Component, OnInit } from '@angular/core';
import { PagSeguroService } from './pagseguro.service';
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
//import { PagSeguroOptions } from "./pagseguro.options";

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

  constructor(private pagSeguroService: PagSeguroService, public formBuilder: FormBuilder) {
  }

  async ngOnInit() {
    this.initForm();
    var that = this;
    // carrega o .js do PagSeguro
    await this.pagSeguroService.loadScript().then(_ => {
      this.pagSeguroService.startSession().subscribe(result => {
        this.sessionId = result.session.id;
        PagSeguroDirectPayment.setSessionId(this.sessionId);

        // recupera as opçoes de pagamento
        PagSeguroDirectPayment.getPaymentMethods({
          amount: 100.00,
          success: function (response) {
            console.debug('paymentMethods', response);
            that.paymentMethods = response.paymentMethods;
          },
          error: function (response) {
            console.debug('error', response);
          }
          // complete: function(response) {
          //     //tratamento comum para todas chamadas
          // } 
        });
      });
    });
  }

  initForm() {
    this.paymentForm = this.formBuilder.group({
      paymentMethod: ['card'],
      card: this.formBuilder.group({
        cardNumber: ['', [Validators.required, Validators.maxLength(16)]],
        brand: ['', [Validators.required]],
        validity: ['', [Validators.required]]
      }),
    });
  }

  initializeComponent() {
    this.pagSeguroService.loadScript();
  }

  /**
   * Recupera a bandeira do cartão, ao se digitar os primeiros 6 numeros
   */
  getBrand() {
    var that = this;
    if (this.paymentForm.value.card.cardNumber.length >= 6) {
      if (!this.cardBrand) {
        PagSeguroDirectPayment.getBrand({
          cardBin: this.paymentForm.value.card.cardNumber,
          success: function (result) {
            that.cardBrand = result.brand;
            console.debug('card brand is now', that.cardBrand);

          },
          error: function (error) {
            if (error) {
              //console.debug("setting form error", error);
              that.paymentForm.controls['card'].setErrors({ 'number': true });
            }
          }
        });
      }
    } else {
      that.cardBrand = null;
    }  
  }

  getCardImage() {
    if (this.paymentMethods && this.cardBrand) {
      return this.pagSeguroService.getOptions().filesURL + this.paymentMethods.CREDIT_CARD.options[this.cardBrand.name.toUpperCase()].images.SMALL.path;
    } else {
      return '';
    }
  }

  getCardDisplayName() {
    if (this.paymentMethods && this.cardBrand) {
      return this.paymentMethods.CREDIT_CARD.options[this.cardBrand.name.toUpperCase()].displayName;
    } else {
      return '';
    }
  }

}
