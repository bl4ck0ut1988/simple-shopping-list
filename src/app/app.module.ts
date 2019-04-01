import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {HttpClientModule} from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AngularMaterialModule } from './angular-material/angular-material.module';
import { AddFriendDialogComponent } from './dialogs/add-friend-dialog.component';
import { SetValueDialogComponent } from './dialogs/set-value-dialog.component';
import { SelectValueDialogComponent } from './dialogs/select-value-dialog.component';
import { ConfirmDialogComponent } from './dialogs/confirm-dialog.component';
import { ListViewComponent } from './list-view/list-view.component';
import { LoginComponent } from './login/login.component';
import { NotificationSnackBarComponent } from './login/login.component';
import { AppRoutingModule } from './/app-routing.module';
import { AuthService } from './auth.service';

import { AngularFireModule } from '@angular/fire';
import { AngularFireDatabaseModule } from '@angular/fire/database';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireAuthModule } from '@angular/fire/auth';

@NgModule({
  entryComponents: [
    AppComponent,
    AddFriendDialogComponent,
    SetValueDialogComponent,
    SelectValueDialogComponent,
    ConfirmDialogComponent,
    NotificationSnackBarComponent,
    LoginComponent
  ],
  declarations: [
    AppComponent,
    AddFriendDialogComponent,
    SetValueDialogComponent,
    SelectValueDialogComponent,
    ConfirmDialogComponent,
    ListViewComponent,
    LoginComponent,
    NotificationSnackBarComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    HttpClientModule,
    AngularMaterialModule,
    AppRoutingModule,
    ReactiveFormsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireDatabaseModule,
    AngularFireAuthModule,
    AngularFirestoreModule,
  ],
  providers: [AuthService],
  bootstrap: [AppComponent]
})
export class AppModule { }
