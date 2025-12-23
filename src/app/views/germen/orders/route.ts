import { Routes } from '@angular/router';

import {OrderListComponent} from './order-list/order-list.component'



export const routes: Routes = [
  {
    path: '',
    component: OrderListComponent,
    data: {
      title: 'Pending Orders'
    }

  }
];
