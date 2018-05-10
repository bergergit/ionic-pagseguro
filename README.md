# ionic-pagseguro

## Instalação

```bash
$ npm install ionic-pagseguro --save
```

## Consumindo a biblioteca

No seu `AppModule`:

```typescript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';

// Adicione o PagSeguroModule.forRoot() no seu app.module
import { PagSeguroComponent } from 'ionic-pagseguro';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,

    // Especifique o móduglo do PagSeguro
    PagSeguroModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

E PagSeguroModule.forChild() em todas as páginas que forem utilizar este módulo
```typescript
@NgModule({
  declarations: [
    MyPage,
  ],
  imports: [
    IonicPageModule.forChild(MyPage),
    PagSeguroModule.forChild()
  ],
  providers: [  ],
  exports: [ MyPage ]
})
```

Inicialize o carregamento do Javascript do PagSeguro. Recomendo fazer isso no app.component
```typescript
this.platform.ready().then(() => {
  // Inicialize a biblioteca do PagSeguro bo seu app.component
  this.pagSeguroService.setOptions({
    scriptURL: 'https://stc.pagseguro.uol.com.br/pagseguro/api/v2/checkout/pagseguro.directpayment.js',
    remoteApi: {
      sessionURL: 'https://myapp.cloudfunctions.net/startSession',
      checkoutURL: 'https://myapp.cloudfunctions.net/checkout'
    } 
  });
}); 

// pre-loading script
setTimeout(() => {
  this.pagSeguroService.loadScript();
}, 1000);
```

```html
<!-- Use a biblioteca no seu HTML. A função dentro do (checkout) será invocada quando o usuário clicar em Efetuar pagamento  -->
<h1>
  {{title}}
</h1>
<pagseguro-component (checkout)="checkout()"></pagseguro-component>
```

Você pode injetar o PagSeguroService no seu Component e definir alguns dados para ele, usando pagSeguroService.addCheckoutData:
```typescript
constructor(public pagSeguroService: PagSeguroService) {
  this.setCheckoutItems();
}

public setCheckoutItems() {
  let itemsData: PagSeguroData = {
    items: [{
      item: {
        id: '1234',
        description: 'Meu produto'
      }
    }]
  }
  this.pagSeguroService.addCheckoutData(itemsData);
}
```

## API remota
O PagSeguro recomenda que a sessão do usuário seja iniciado através de um servidor, por questões de segurança.
Neste projeto, estou utilizando NodeJS via Firebase Cloud Functions. Você pode utilizar o que preferir.

Abaixo, um exemplo de código para iniciar a session em NodeJS

```typescript
/**
 * Inicia a sessao com o PagSeguro
 */
exports.startSession = functions.https.onRequest((req, res) => {
    // Enable CORS using the `cors` express middleware.
    cors(req, res, () => {
        request.post({
            url: functions.config().pagseguro.session_url,
            qs: { email: functions.config().pagseguro.email, token: functions.config().pagseguro.token }
        }, function result(err, httpResponse, body) {
            if (err || httpResponse.statusCode !== 200) {
                console.error('Start session error', err);
                console.error('body', body);
                res.status(httpResponse && httpResponse.statusCode || 500).send();
                return;
            }
            res.status(200).send(parser.toJson(body));
        });
    });
});
```

## Documentação PagSeguro
Esta biblioteca serve como base para realizar um checkout transparente do PagSeguro, utilizando Ionic.
Possivelmente você precisará fazer modificações para o seu projeto.
Toda a documentação do checkout transparente do PagSeguro está aqui: https://dev.pagseguro.uol.com.br/documentacao/pagamento-online/pagamentos/pagamento-transparente

## Licença

Você pode utilizar esta biblioteca como base para seu projeto, porém não pode modificá-la e redistribuí-la.

MIT © [Fabio Berger](mailto:fabioberger@gmail.com)
