import { PagSeguroOptions } from './pagseguro.options';

export const PagSeguroDefaultOptions: PagSeguroOptions = {
    scriptURL: 'https://stc.sandbox.pagseguro.uol.com.br/pagseguro/api/v2/checkout/pagseguro.directpayment.js',
    sessionURL: 'http://localhost:5000/passaki-dev/us-central1/startSession',
    filesURL: 'https://stc.pagseguro.uol.com.br',
    loadScript: true
}