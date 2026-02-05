import { Routes } from '@angular/router';
import { MissingProductsComponent } from './missing-products.component';

export const routes: Routes = [
    {
        path: '',
        component: MissingProductsComponent,
        data: {
            title: 'Missing Products'
        }
    }
];
