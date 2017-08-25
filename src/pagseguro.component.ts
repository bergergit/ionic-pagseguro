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
  public cardBrand: {};
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
        cardNumber: ['', [Validators.required]],
        brand: ['', [Validators.required]]
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
    console.debug('this.cardBrand', this.cardBrand);
    console.debug('length', this.paymentForm.value.card.cardNumber.length);
    if (this.paymentForm.value.card.cardNumber.length >= 6 && !this.cardBrand) {
      PagSeguroDirectPayment.getBrand({
        cardBin: this.paymentForm.value.card.cardNumber,
        success: function (result) {
          console.debug('brand result', result);
          
        },
        error: function (error) {
          console.debug('getBrand error', error);

        }
      });
    } else {
      this.cardBrand = null;
    }

  }

}
