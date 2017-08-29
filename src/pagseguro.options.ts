export interface PagSeguroOptions  {  
    scriptURL?: string,             // A URL do .js do PagSeguro (produção ou sandbox)
    filesURL?: string               // URL base para imagens do PagSeguro 
    loadScript?: boolean            // caso queira que este Componente carregue o .js automaticamente
    remoteApi: {                    // URLs de configuração da sua API remota
        sessionURL: string;        // URL que irá iniciar sessao com PagSeguro
        checkoutURL: string;       // URL que irá completar o pagamento com o PagSeguro
    }
} 