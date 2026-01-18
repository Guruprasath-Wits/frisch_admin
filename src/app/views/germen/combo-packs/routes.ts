import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Combo Packs'
        },
        children: [
            {
                path: '',
                loadComponent: () => import('./combo-packs.component').then(m => m.ComboPacksComponent),
                data: {
                    title: 'List'
                }
            },
            {
                path: 'add',
                loadComponent: () => import('./add-combo/add-combo.component').then(m => m.AddComboComponent),
                data: {
                    title: 'Add Combo Pack'
                }
            },
            {
                path: 'edit/:id',
                loadComponent: () => import('./edit-combo/edit-combo.component').then(m => m.EditComboComponent),
                data: {
                    title: 'Edit Combo Pack'
                }
            }
        ]
    }
];
