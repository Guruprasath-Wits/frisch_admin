import { Routes } from '@angular/router';

import {ProductsComponent} from './products.component'

export const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Products'
    }

    ,
    children: [
      {
        path: '',
        loadComponent: () => import('./products.component').then(m => m.ProductsComponent),
        data: {
          title: 'UserList'
        }
      },
      {
        path: 'add',
        loadComponent: () => import('./addproduct/addproduct.component').then(m => m.AddproductComponent),
        data: {
          title: 'Add Product'
        }
      },
      {
        path: 'edit/:id',
        loadComponent: () => import('./editproduct/editproduct.component').then(m => m.EditproductComponent),
        data: {
          title: 'Edit Product'
        }
      },
    ]
  }
];
