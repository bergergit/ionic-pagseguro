import { PagSeguroOptions } from './pagseguro.options';

export const PagSeguroDefaultOptions: PagSeguroOptions = {
    scriptURL: 'https://stc.sandbox.pagseguro.uol.com.br/pagseguro/api/v2/checkout/pagseguro.directpayment.js',
    filesURL: 'https://stc.pagseguro.uol.com.br',
    loadScript: true,
    remoteApi: {
        sessionURL: null,
        checkoutURL: null
    }

}