import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Users'
    },
    children: [
      {
        path: '',
        loadComponent: () => import('./userslist/userslist.component').then(m => m.UserslistComponent),
        data: {
          title: 'UserList'
        }
      },
      

      {
        path: 'useradd',
        loadComponent: () => import('./adduser/adduser.component').then(m => m.AdduserComponent),
        data: {
          title: 'UserAdd'
        }
      },

      {
        path: 'useredit/:id',
        loadComponent: () => import('./edituser/edituser.component').then(m => m.EdituserComponent),
        data: {
          title: 'UserEdit'
        }
      }
    ]
  }
];

