import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
    selector: 'set-value-dialog.component',
    templateUrl: 'set-value-dialog.component.html',
  })
    export class SetValueDialogComponent {

    constructor(
        public dialogRef: MatDialogRef<SetValueDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any) {}

    onNoClick(): void {
        this.dialogRef.close();
    }
}
