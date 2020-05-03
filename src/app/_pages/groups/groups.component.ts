import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { GroupsService } from 'src/app/_services/groups.service';
import { NbToastrService } from '@nebular/theme';
import {
  TableEntry,
  TableColumn,
} from 'src/app/_components/table/table.component';
import { takeUntil } from 'rxjs/operators';

@Component({
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss'],
})
export class GroupsComponent implements OnInit, OnDestroy {
  destroyed$ = new Subject<void>();
  groupsData: TableEntry[] = null;
  columns: TableColumn[] = [
    { key: 'id', title: 'Id' },
    { key: 'group_name', title: 'Name' },
  ];

  constructor(
    private groupsService: GroupsService,
    private toastr: NbToastrService
  ) {}

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  ngOnInit(): void {
    this.groupsService.groups$.pipe(takeUntil(this.destroyed$)).subscribe(
      (groupsData) => {
        this.groupsData = groupsData.map((group) => ({
          data: { ...group, routerLink: ['/groups', group.id] },
        }));
      },
      (err) => {
        this.groupsData = [];
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
