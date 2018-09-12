import { NgModule } from '@angular/core';
import {
  MatCheckboxModule,
  MatDialogModule,
  MatDividerModule,
  MatInputModule,
  MatButtonModule,
  MatCardModule,
  MatListModule,
  MatIconModule,
  MatMenuModule,
  MatProgressBarModule,
  MatProgressSpinnerModule,
  MatSelectModule,
  MatToolbarModule
} from '@angular/material';

@NgModule({
  imports: [
    MatCheckboxModule,    
    MatDialogModule,
    MatDividerModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatToolbarModule
  ],
  exports: [
    MatCheckboxModule,    
    MatDialogModule,
    MatDividerModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatToolbarModule
  ]
})
export class AngularMaterialModule { }
