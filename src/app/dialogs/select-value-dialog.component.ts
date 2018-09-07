import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
    selector: 'select-value-dialog.component',
    templateUrl: 'select-value-dialog.component.html',
  })
    export class SelectValueDialogComponent {

    constructor(
        public dialogRef: MatDialogRef<SelectValueDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any) {}

    onNoClick(): void {
        this.dialogRef.close();
    }
}
