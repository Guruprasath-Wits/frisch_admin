import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./tax.component').then(m => m.TaxComponent),
        data: {
            title: 'Steuer'
        }
    }
];
