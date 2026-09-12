import type { Locale } from "@/lib/types";
import type { MenuRow } from "@/lib/menu";
import { menuCopy } from "@/lib/menu-copy";

export function MenuList({ rows, locale }: { rows: MenuRow[]; locale: Locale }) {
  const groups = [...new Set(rows.map(row => row.section))];
  return <div className="online-menu-list">{groups.map(group => <section key={group}>
    {group && <h3>{group}</h3>}
    {rows.filter(row => row.section === group).map(row => <article className={row.available ? "" : "menu-unavailable"} key={row.id}>
      <div><h4>{row.name}</h4>{row.variant && <p>{row.variant}</p>}{!row.available && <small>{menuCopy[locale].soldOut}</small>}</div>
      <strong>฿{row.price}</strong>
    </article>)}
  </section>)}</div>;
}
