export interface PagSeguroOptions  {  
    scriptURL?: string,         // A URL do .js do PagSeguro (produção ou sandbox)
    sessionURL?: string         // URL para iniciar sessao com PagSeguro
    filesURL: string            // URL base para imagens do PagSeguro
    loadScript?: boolean        // caso queira que este Componente carregue o .js automaticsamente
}