import { Pipe, PipeTransform } from '@angular/core';
import { formatAmount, formatNumber } from '../../core/utils/money';

@Pipe({ name: 'inr', standalone: true })
export class InrPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatAmount(value);
  }
}

@Pipe({ name: 'num', standalone: true })
export class NumPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatNumber(value);
  }
}
