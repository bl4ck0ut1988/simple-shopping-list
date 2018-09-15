import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router'; 
import { LoginComponent } from './login/login.component';
import { ListViewComponent } from './list-view/list-view.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'listview', component: ListViewComponent }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
exports: [ RouterModule ]
})
export class AppRoutingModule { }
