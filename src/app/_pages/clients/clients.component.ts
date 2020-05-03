import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { ClientsService } from 'src/app/_services/clients.service';
import { NbToastrService } from '@nebular/theme';
import {
  TableEntry,
  TableColumn,
} from 'src/app/_components/table/table.component';
import { takeUntil } from 'rxjs/operators';

@Component({
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.scss'],
})
export class ClientsComponent implements OnInit, OnDestroy {
  destroyed$ = new Subject<void>();
  clientsData: TableEntry[] = null;
  columns: TableColumn[] = [{ key: 'id', title: 'Id' }];

  constructor(
    private clientsService: ClientsService,
    private toastr: NbToastrService
  ) {}

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  ngOnInit(): void {
    this.clientsService.clients$.pipe(takeUntil(this.destroyed$)).subscribe(
      (clientsData) => {
        this.clientsData = clientsData.map((client) => ({
          data: { ...client, routerLink: ['/clients', client.id] },
        }));
      },
      (err) => {
        this.clientsData = [];
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
