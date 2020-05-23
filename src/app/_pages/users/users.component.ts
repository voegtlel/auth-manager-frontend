import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { ApiService } from 'src/app/_services/api.service';
import { takeUntil } from 'rxjs/operators';
import { NbToastrService } from '@nebular/theme';
import {
  TableEntry,
  TableColumn,
} from 'src/app/_components/table/table.component';
import { UsersService } from 'src/app/_services/users.service';

@Component({
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit, OnDestroy {
  destroyed$ = new Subject<void>();
  usersData: TableEntry[] = null;
  columns: TableColumn[] = [];

  constructor(
    private usersService: UsersService,
    private toastr: NbToastrService
  ) {}

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  ngOnInit(): void {
    this.usersService.userListViewData$
      .pipe(takeUntil(this.destroyed$))
      .subscribe(
        (usersData) => {
          this.usersData = usersData.users.map((user) => ({
            data: user.properties.reduce(
              (o, v) => {
                o[v.key] = v.value;
                return o;
              },
              { user_id: user.user_id, routerLink: ['/users', user.user_id] }
            ),
          }));
          this.columns = usersData.properties.map((property) => ({
            ...property,
            clickableCells: true,
          }));
        },
        (err) => {
          this.usersData = [];
          this.columns = [];
          if (err?.status === 0) {
            this.toastr.danger(err?.statusText, 'Error');
          } else if (err?.error?.detail) {
            this.toastr.danger(err?.error?.detail, 'Error');
          } else if (err?.error) {
            this.toastr.danger(err?.error, 'Error');
          }
        }
      );
  }
}
