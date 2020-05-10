import {
  Component,
  OnInit,
  Input,
  TemplateRef,
  ViewChild,
  Output,
  EventEmitter,
} from '@angular/core';
import { NgxFileDropEntry, FileSystemFileEntry } from 'ngx-file-drop';
import { ImageCropperComponent } from 'ngx-image-cropper';
import { NbDialogService, NbDialogRef, NbToastrService } from '@nebular/theme';
import { ApiService } from 'src/app/_services/api.service';
import { AuthService } from 'src/app/_services/auth.service';

@Component({
  selector: 'app-picture-editor',
  templateUrl: './picture-editor.component.html',
  styleUrls: ['./picture-editor.component.scss'],
})
export class PictureEditorComponent implements OnInit {
  @Input() pictureUrl: string;
  @Input() userName: string;
  @Input() userId: string;
  @Input() registrationToken: string;

  @Output() pictureChange = new EventEmitter<Blob>();

  pictureSaving = false;
  pictureLoading = false;
  pictureLoadFailure = false;

  pictureDroppedFile: File;
  lastError: string;

  @ViewChild(ImageCropperComponent) imageCropper: ImageCropperComponent;

  profileDialog: NbDialogRef<any>;

  get initials(): string {
    const splitted = this.userName.split(/\s/, 1);
    if (splitted.length === 2) {
      return splitted[0].charAt(0) + splitted[1].charAt(0);
    }
    return splitted[0].charAt(0);
  }

  get canEdit(): boolean {
    return this.authService.isSelf(this.userId);
  }

  constructor(
    private dialogService: NbDialogService,
    private apiService: ApiService,
    private authService: AuthService,
    private toastr: NbToastrService
  ) {}

  ngOnInit(): void {}

  pictureDropped(e: NgxFileDropEntry[]) {
    this.pictureLoading = true;
    this.pictureLoadFailure = false;
    this.pictureDroppedFile = null;
    const fileEntry = e[0].fileEntry as FileSystemFileEntry;
    fileEntry.file((file) => {
      this.pictureDroppedFile = file;
    });
  }

  pictureImageFailed() {
    this.pictureLoading = false;
    this.pictureLoadFailure = true;
  }

  pictureLoaded() {
    this.pictureLoading = false;
  }

  openSelectDialog(templateRef: TemplateRef<any>) {
    this.profileDialog = this.dialogService.open(templateRef, {
      dialogClass: 'dialog-fill',
    });
    this.profileDialog.onClose.subscribe((result) => {
      if (result) {
        this.pictureUrl = result;
      }
    });
  }

  closeDialog() {
    this.profileDialog.close();
  }

  clickDrop(event: MouseEvent) {
    event.stopPropagation();
    const element = event.target as Element;
    if (element && element.classList.contains('drop-content')) {
      this.closeDialog();
    }
  }

  pictureSave() {
    this.pictureSaving = true;
    this.lastError = null;
    const cropResult = this.imageCropper.crop();
    this.pictureLoading = false;
    this.pictureLoadFailure = false;
    fetch(cropResult.base64)
      .then((res) => res.blob())
      .then((blob) => {
        return this.apiService
          .uploadPicture(this.userId, blob, this.registrationToken)
          .toPromise();
      })
      .then(
        () => {
          this.profileDialog.close(cropResult.base64);
          this.pictureDroppedFile = null;
          this.pictureSaving = false;
        },
        (err) => {
          if (err?.status === 0) {
            this.toastr.danger(err?.statusText, 'Error');
            this.lastError = err?.statusText;
          } else if (err?.error?.detail) {
            this.toastr.danger(err?.error?.detail, 'Error');
            this.lastError = err?.error?.detail.toString();
          } else if (err?.error) {
            this.toastr.danger(err?.error, 'Error');
            this.lastError = err?.error.toString();
          }
          this.pictureSaving = false;
        }
      );
  }
}
