import {
  Component,
  OnChanges,
  Input,
  SimpleChanges,
  Output,
  EventEmitter,
  TemplateRef,
} from '@angular/core';
import {
  NbTreeGridDataSourceBuilder,
  NbSortDirection,
  NbTreeGridDataSource,
  NbSortRequest,
} from '@nebular/theme';
import { Observable } from 'rxjs';

export interface TableEntry {
  data: Record<string, any>;
}

export interface ITableEntry<T> extends TableEntry {
  data: T;
}

export interface TableColumn {
  key: string;
  value?: (entry: TableEntry) => string;
  value$?: (entry: TableEntry) => Observable<string>;
  title: string;
  icon?: string;
  compact?: boolean;
  compact2?: boolean;
  onClickItem?: (entry: TableEntry, $event) => void;
  action?: (entry: TableEntry) => void;
  templateRef?: TemplateRef<any>;
  clickableCells?: boolean;
  centerCells?: boolean;
  noPaddingCells?: boolean;
}

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
})
export class TableComponent implements OnChanges {
  allColumns: string[] = [];

  sortColumn: string;
  sortDirection: NbSortDirection = NbSortDirection.NONE;
  dataSource: NbTreeGridDataSource<TableEntry> = null;
  loading = true;

  @Input() readOnly = false;

  @Input() data: TableEntry[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() showSearch = true;
  @Output() clickItem = new EventEmitter<TableEntry>();

  constructor(
    private dataSourceBuilder: NbTreeGridDataSourceBuilder<TableEntry>
  ) {
    this.dataSource = this.dataSourceBuilder.create([]);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.data) {
      this.dataSource.setData([]);
      setTimeout(() => {
        this.dataSource.setData(this.data);
        this.loading = false;
      }, 0);
    }
    if (changes.columns) {
      if (this.columns) {
        this.allColumns = this.columns.map((prop) => prop.key);
      } else {
        this.allColumns = [];
      }
    }
  }

  updateSort(sortRequest: NbSortRequest): void {
    this.sortColumn = sortRequest.column;
    this.sortDirection = sortRequest.direction;
  }

  getSortDirection(column: string): NbSortDirection {
    if (this.sortColumn === column) {
      return this.sortDirection;
    }
    return NbSortDirection.NONE;
  }

  onClickItem(row: TableEntry, column: TableColumn, $event) {
    if (row.data.onClickItem) {
      row.data.onClickItem($event);
    }
    if ($event.cancelBubble) {
      return;
    }
    if (column.onClickItem) {
      column.onClickItem(row, $event);
    }
    if ($event.cancelBubble) {
      return;
    }
    this.clickItem.emit(row);
  }
}
