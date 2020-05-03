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

export interface TableEntry {
  data: Record<string, any>;
}

export interface TableColumn {
  key?: string;
  title: string;
  icon?: string;
  compact?: boolean;
  onClickItem?: (entry: TableEntry, $event) => void;
  action?: (entry: TableEntry) => void;
  templateRef?: TemplateRef<any>;
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
      if (this.data) {
        this.dataSource.setData(this.data);
      } else {
        this.dataSource.setData([]);
      }
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
