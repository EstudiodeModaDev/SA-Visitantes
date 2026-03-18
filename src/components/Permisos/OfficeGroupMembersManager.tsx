import * as React from "react";
import "./OfficeGroupMembersManager.css";
import { useOfficeGroupMembers } from "../../funcionalidades/useOfficeGroupMembers";

type GroupMode = "users" | "admins";

type Props = {
  usersGroupId: string;
  adminsGroupId: string;
  title?: string;
  description?: string;
};

export function OfficeGroupMembersManager({usersGroupId, adminsGroupId, title = "Administración de accesos", description = "Consulta, agrega y elimina usuarios de los grupos de la aplicación",}: Props) {
  const [mode, setMode] = React.useState<GroupMode>("users");

  const activeGroupId = mode === "users" ? usersGroupId : adminsGroupId;
  const modeLabel = mode === "users" ? "usuarios de la app" : "administradores de la app";
  const singularLabel = mode === "users" ? "usuario" : "administrador";

  const {members, searchResults, loadingMembers, searchingUsers, addingUserId, removingUserId, error, memberIds, searchUsers, addMember, removeMember, loadMembers, clearSearchResults,} = useOfficeGroupMembers(activeGroupId);

  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    setQuery("");
    clearSearchResults();
  }, [mode,]);

  React.useEffect(() => {
    const handle = setTimeout(() => {
      void searchUsers(query);
    }, 350);

    return () => clearTimeout(handle);
  }, [query, searchUsers]);

  return (
    <div className="ogm-card">
      <div className="ogm-header">
        <div>
          <h3 className="ogm-title">{title}</h3>
          <p className="ogm-subtitle">{description}</p>
        </div>

        <button className="ogm-btn ogm-btn--ghost" onClick={() => void loadMembers()} type="button">
          Recargar
        </button>
      </div>

      <div className="ogm-mode-switch">
        <button type="button" className={`ogm-mode-btn ${mode === "users" ? "is-active" : ""}`} onClick={() => setMode("users")}>
          Usuarios app
        </button>

        <button type="button" className={`ogm-mode-btn ${mode === "admins" ? "is-active" : ""}`} onClick={() => setMode("admins")}>
          Admins app
        </button>
      </div>

      {!!error && <div className="ogm-alert ogm-alert--error">{error}</div>}

      <div className="ogm-grid">
        <section className="ogm-panel">
          <div className="ogm-panel__header">
            <h4>Agregar {modeLabel}</h4>
            <span>{searchingUsers ? "Buscando..." : `${searchResults.length} resultado(s)`}</span>
          </div>

          <div className="ogm-search">
            <input className="ogm-input" type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, correo o UPN"/>
            <button className="ogm-btn ogm-btn--ghost" type="button" onClick={() => {setQuery(""); clearSearchResults();}}>
              Limpiar
            </button>
          </div>

          <div className="ogm-list">
            {!query.trim() ? (
              <div className="ogm-empty">Escribe algo para buscar usuarios.</div>
            ) : searchResults.length === 0 ? (
              <div className="ogm-empty">
                {searchingUsers ? "Buscando usuarios..." : "No se encontraron usuarios."}
              </div>
            ) : (
              searchResults.map((user) => {
                const alreadyInGroup = memberIds.has(user.id.toLowerCase());

                return (
                  <div key={user.id} className="ogm-row">
                    <div className="ogm-user">
                      <div className="ogm-avatar">
                        {user.displayName?.slice(0, 1).toUpperCase() || "U"}
                      </div>

                      <div className="ogm-user__meta">
                        <strong>{user.displayName}</strong>
                        <span>{user.mail || user.userPrincipalName || "Sin correo"}</span>
                        {user.jobTitle ? <small>{user.jobTitle}</small> : null}
                      </div>
                    </div>

                    <div className="ogm-row__actions">
                      {alreadyInGroup ? (
                        <span className="ogm-badge">Ya pertenece</span>
                      ) : (
                        <button className="ogm-btn ogm-btn--primary" disabled={addingUserId === user.id} onClick={() => void addMember(user.id)}  type="button">
                          {addingUserId === user.id ? "Agregando..." : "Agregar"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="ogm-panel">
          <div className="ogm-panel__header">
            <h4>{mode === "users" ? "Usuarios actuales" : "Administradores actuales"}</h4>
            <span>{loadingMembers ? "Cargando..." : `${members.length} ${modeLabel}`}</span>
          </div>

          <div className="ogm-list">
            {loadingMembers ? (
              <div className="ogm-empty">Cargando {modeLabel}...</div>
            ) : members.length === 0 ? (
              <div className="ogm-empty">Este grupo no tiene personas visibles.</div>
            ) : (
              members.map((member) => (
                <div key={member.id} className="ogm-row">
                  <div className="ogm-user">
                    <div className="ogm-avatar">
                      {member.displayName?.slice(0, 1).toUpperCase() || "U"}
                    </div>

                    <div className="ogm-user__meta">
                      <strong>{member.displayName}</strong>
                      <span>{member.mail || member.userPrincipalName || "Sin correo"}</span>
                      {member.jobTitle ? <small>{member.jobTitle}</small> : null}
                    </div>
                  </div>

                  <div className="ogm-row__actions">
                    <button className="ogm-btn ogm-btn--danger" disabled={removingUserId === member.id} type="button" onClick={() => {
                        const ok = window.confirm( `¿Seguro que deseas eliminar a ${member.displayName} como ${singularLabel} del grupo?`);
                        if (!ok) return;
                        void removeMember(member.id);
                      }}>
                      {removingUserId === member.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}