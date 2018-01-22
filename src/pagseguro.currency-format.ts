import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

@Pipe({
  name: 'psCurrencyFormat'
})
export class PagseguroCurrencyFormatPipe implements PipeTransform {
    transform(value: number, locale: string, currency_symbol: boolean, number_format: string = '1.2-2'): string {
        if (value || value === 0) {
            let currencyPipe = new CurrencyPipe(locale)
            let new_value: string;

            new_value = currencyPipe.transform(value, locale, currency_symbol, number_format);
            if (locale == 'BRL') {
                new_value = new_value.replace('.', ',');
            } 

            return new_value;                                    
        }
    }
}