import { useId, useMemo, useState, type ReactNode } from 'react';
import { cx } from './cx';

export type Column<T> = {
  key: keyof T & string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
  /** Marks this column's cells as the row header (scope="row"). */
  rowHeader?: boolean;
};
export type TableProps<T> = {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  zebra?: boolean;
  dense?: boolean;
  initialSort?: { key: keyof T & string; dir: 'ascending' | 'descending' };
  /** Shown in a single full-width cell when rows is empty. */
  empty?: ReactNode;
};

/** Accessible data table: caption, header scope, sort buttons with aria-sort, and a focusable scroll region. */
export function Table<T>({ caption, columns, rows, rowKey, zebra, dense, initialSort, empty = 'No rows.' }: TableProps<T>) {
  const capId = useId();
  const [sort, setSort] = useState(initialSort);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const m = sort.dir === 'ascending' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const x = a[sort.key] as unknown;
      const y = b[sort.key] as unknown;
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * m;
      return String(x).localeCompare(String(y)) * m;
    });
  }, [rows, sort]);

  function toggle(key: keyof T & string) {
    setSort((s) => ({ key, dir: s?.key === key && s.dir === 'ascending' ? 'descending' : 'ascending' }));
  }

  return (
    <div className="em-table-wrap" role="region" aria-labelledby={capId} tabIndex={0}>
      <table className={cx('em-table', zebra && 'em-table--zebra', dense && 'em-table--dense')}>
        <caption id={capId}>{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => {
              const dir = sort?.key === c.key ? sort.dir : undefined;
              return (
                <th key={c.key} scope="col" aria-sort={c.sortable ? (dir ?? 'none') : undefined}>
                  {c.sortable ? (
                    <button type="button" className="em-sort" onClick={() => toggle(c.key)}>
                      {c.header}
                      <span className="em-sort-icon" aria-hidden="true">{dir === 'ascending' ? '▲' : dir === 'descending' ? '▼' : '↕'}</span>
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>{empty}</td>
            </tr>
          ) : (
            sorted.map((r) => (
              <tr key={rowKey(r)}>
                {columns.map((c) => {
                  const v = c.render ? c.render(r) : String(r[c.key] ?? '');
                  return c.rowHeader ? (
                    <th key={c.key} scope="row">{v}</th>
                  ) : (
                    <td key={c.key}>{v}</td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
