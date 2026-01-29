import { Pipe, PipeTransform } from '@angular/core';
import { formatDistanceToNow } from 'date-fns';
import { hu } from 'date-fns/locale';


@Pipe({
  name: 'timeAgo',
  pure: false,
  standalone: false
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: Date | string | number): string {
    if (!value) return '';

    return formatDistanceToNow(new Date(value), {
      addSuffix: true,
      locale: hu
    });
  }
}
