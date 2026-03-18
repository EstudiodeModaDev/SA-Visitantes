import type { AnySection } from "../../App";
import type { User } from "../../models/user";
import "./Sidebar.css";

type SidebarProps = {
  sections: AnySection[];
  activeId: string;
  onSelect: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  userInfo: User
};

export function SidebarSimple({sections, activeId, onSelect, collapsed, onToggle, userInfo}: SidebarProps) {
  const firstLetter = userInfo?.displayName?.[0] ?? "?";
  return (
    <aside className={`gd-sidebar ${collapsed ? "gd-sidebar--collapsed" : ""}`}>
      <div className="gd-sidebar__header">
        <button type="button"  className="gd-sidebar__toggle" onClick={onToggle} aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}>
          {collapsed ? "»" : "«"}
        </button>
      </div>

      <nav className="gd-sidebar__nav">
        {sections.map((s) => {
          const active = s.id === activeId;
          return (
            <button key={s.id} className={`gd-sidebar__item ${active ? "is-active" : ""} ${collapsed ? "is-compact" : ""}`} onClick={() => onSelect(s.id)}>
              <span className="gd-sidebar__icon" aria-hidden="true">
                {s.icon ?? "•"}
              </span>
              <span className="gd-sidebar__label">{s.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="gd-sidebar__userCard">
        <div className="gd-sidebar__userAvatar" aria-hidden="true">
          {firstLetter}
        </div>

        <div className="gd-sidebar__userText">
          <span className="gd-sidebar__userName">{userInfo?.displayName}</span>
          <small className="gd-sidebar__userMail">{userInfo?.mail}</small>
        </div>
      </div>
    </aside>
  );
}