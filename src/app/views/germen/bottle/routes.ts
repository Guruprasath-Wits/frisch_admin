import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./bottle.component').then(m => m.BottleComponent),
        data: {
            title: 'Flasche'
        }
    }
];
