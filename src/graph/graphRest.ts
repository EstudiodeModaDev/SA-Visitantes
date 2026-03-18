export type GraphRecipient = {
  emailAddress: {
    address: string;
  };
};

export type GraphSendMailPayload = {
  message: {
    subject: string;
    body: {
      contentType: "Text" | "HTML";
      content: string;
    };
    toRecipients: GraphRecipient[];
    ccRecipients?: GraphRecipient[];
  };
  saveToSentItems?: boolean;
};

export type GraphUserLite = {
  id: string;
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
};

export class GraphRest {
  private getToken: () => Promise<string>;
  private base = 'https://graph.microsoft.com/v1.0/';

  constructor(getToken: () => Promise<string>, baseUrl?: string) {
    this.getToken = getToken;
    if (baseUrl) this.base = baseUrl;
  }

  // Core: hace la llamada y parsea respuesta de forma segura (maneja 204/no content)
  private async call<T>(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, body?: any, init?: RequestInit): Promise<T> {
    const token = await this.getToken();
    const hasBody = body !== undefined && body !== null;
    const {headers: initHeaders, ...resInit} = init ?? {}

    const res = await fetch(this.base + path, {
      method,
      ...resInit,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        // Quita esta Prefer si no la necesitas
        Prefer: 'HonorNonIndexedQueriesWarningMayFailRandomly',
        ...(initHeaders || {}),
      },
      body: hasBody ? JSON.stringify(body) : undefined,
    });

    // ---- Manejo de error con mensaje detallado de Graph ----
    if (!res.ok) {
      let detail = '';
      try {
        const txt = await res.text();
        if (txt) {
          try {
            const j = JSON.parse(txt);
            detail = j?.error?.message || j?.message || txt;
          } catch {
            detail = txt;
          }
        }
      } catch {}
      throw new Error(`${method} ${path} → ${res.status} ${res.statusText}${detail ? `: ${detail}` : ''}`);
    }

    // ---- 204 No Content o respuesta vacía ----
    if (res.status === 204) return undefined as unknown as T;

    // ---- Parseo seguro según content-type ----
    const ct = res.headers.get('content-type') || '';
    const txt = await res.text(); // evita error si está vacío
    if (!txt) return undefined as unknown as T;

    if (ct.includes('application/json')) {
      return JSON.parse(txt) as T;
    }

    // Si la respuesta no es JSON, retorna texto
    return txt as unknown as T;
  }

  async getBlob(path: string) {
      const token = await this.getToken(); // mismo token que ya te sirve
      const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Graph ${res.status}`);
    return await res.blob();
  }

  // Helpers públicos
  get<T = any>(path: string, init?: RequestInit) {
    return this.call<T>('GET', path, undefined, init);
  }

  post<T = any>(path: string, body: any, init?: RequestInit) {
    return this.call<T>('POST', path, body, init);
  }

  patch<T = any>(path: string, body: any, init?: RequestInit) {
    // PATCH a /fields suele devolver 204; este call ya lo maneja
    return this.call<T>('PATCH', path, body, init);
  }

  delete(path: string, init?: RequestInit) {
    // DELETE típicamente devuelve 204 No Content
    return this.call<void>('DELETE', path, undefined, init);
  }

  async putBinary<T = any>(path: string,  binary: Blob | ArrayBuffer | Uint8Array, contentType?: string, init?: RequestInit): Promise<T> {
    const token = await this.getToken();

    const res = await fetch(this.base + path, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(contentType ? { "Content-Type": contentType } : {}),
        ...(init?.headers || {}),
      },
      body: binary as any,
      ...init,
    });

    if (!res.ok) {
      let detail = "";
      try {
        const txt = await res.text();
        if (txt) {
          try {
            const j = JSON.parse(txt);
            detail = j?.error?.message || j?.message || txt;
          } catch {
            detail = txt;
          }
        }
      } catch {}

      throw new Error(
        `PUT ${path} → ${res.status} ${res.statusText}${
          detail ? `: ${detail}` : ""
        }`
      );
    }

    if (res.status === 204) return undefined as unknown as T;

    const ct = res.headers.get("content-type") || "";
    const txt = await res.text();
    if (!txt) return undefined as unknown as T;

    if (ct.includes("application/json")) {
      return JSON.parse(txt) as T;
    }

    return txt as unknown as T;
  }

  async getAbsolute<T = any>(url: string, init?: RequestInit): Promise<T> {
    const token = await this.getToken();

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Prefer: 'HonorNonIndexedQueriesWarningMayFailRandomly',
        ...(init?.headers || {}),
      },
      ...init,
    });

    if (!res.ok) {
      let detail = '';
      try {
        const txt = await res.text();
        if (txt) {
          try { detail = JSON.parse(txt)?.error?.message ?? JSON.parse(txt)?.message ?? txt; }
          catch { detail = txt; }
        }
      } catch {}
      throw new Error(`GET (absolute) ${url} → ${res.status} ${res.statusText}${detail ? `: ${detail}` : ''}`);
    }

    if (res.status === 204) return undefined as unknown as T;

    const ct = res.headers.get('content-type') ?? '';
    const txt = await res.text();
    if (!txt) return undefined as unknown as T;
    return ct.includes('application/json') ? JSON.parse(txt) as T : (txt as unknown as T);
  }

  sendMail(fromUser: string, payload: GraphSendMailPayload) {
    const encoded = encodeURIComponent(fromUser);
    return this.post<void>(`/users/${encoded}/sendMail`, payload);
  }

  async postAbsoluteBinary<T = any>(url: string, binary: Blob | ArrayBuffer | Uint8Array, contentType?: string, init?: RequestInit): Promise<T> {
    const token = await this.getToken();

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(contentType ? { "Content-Type": contentType } : {}),
        ...(init?.headers || {}),
      },
      body: binary as any,
      ...init,
    });

    if (!res.ok) {
      let detail = "";
      try {
        const txt = await res.text();
        if (txt) {
          try {
            const j = JSON.parse(txt);
            detail = j?.error?.message || j?.message || txt;
          } catch {
            detail = txt;
          }
        }
      } catch {}

      throw new Error(
        `POST (absolute) ${url} → ${res.status} ${res.statusText}${
          detail ? `: ${detail}` : ""
        }`
      );
    }

    if (res.status === 204) return undefined as unknown as T;

    const ct = res.headers.get("content-type") || "";
    const txt = await res.text();
    if (!txt) return undefined as unknown as T;

    if (ct.includes("application/json")) {
      return JSON.parse(txt) as T;
    }

    return txt as unknown as T;
  }

  async getUserIdByEmail(email: string): Promise<string> {
    const e = (email ?? "").trim();
    if (!e) throw new Error("getUserIdByEmail: email vacío");

    // 1) Intento directo: /users/{id|UPN}
    try {
      const encoded = encodeURIComponent(e);
      const u = await this.get<GraphUserLite>(
        `/users/${encoded}?$select=id,displayName,mail,userPrincipalName`
      );
      if (u?.id) return u.id;
    } catch (err: any) {

    }

    // 2) Fallback con filtro: mail o userPrincipalName
    // Ojo: el $filter debe ir URL-encoded.
    const filter = encodeURIComponent(`mail eq '${e}' or userPrincipalName eq '${e}'`);

    const res = await this.get<{ value: GraphUserLite[] }>(`/users?$select=id,displayName,mail,userPrincipalName&$top=1&$filter=${filter}`);

    const found = res?.value?.[0];
    if (!found?.id) {
      throw new Error(`No se encontró el usuario en Entra ID para: ${e}`);
    }

    return found.id;
  }

  async addUserToGroup(groupId: string, email: string): Promise<void> {
    const gid = (groupId ?? "").trim();
    if (!gid) throw new Error("addUserToGroup: groupId vacío");

    const userId = await this.getUserIdByEmail(email);

    try {
      await this.post<void>(`/groups/${gid}/members/$ref`, {
        "@odata.id": `https://graph.microsoft.com/v1.0/directoryObjects/${userId}`,
      });
    } catch (err: any) {
      const msg = String(err?.message ?? err);

      // "already exists" varía, así que toleramos 400/409 si huele a duplicado
      const isDuplicate =
        msg.includes("409") ||
        msg.includes("added object references already exist") ||
        msg.toLowerCase().includes("already exist");

      if (!isDuplicate) throw err;
    }
  }

  async isUserInGroup(groupId: string, email: string): Promise<boolean> {
    const gid = (groupId ?? "").trim();
    if (!gid) throw new Error("isUserInGroup: groupId vacío");

    const userId = await this.getUserIdByEmail(email);

    const token = await this["getToken"](); // acceso al token sin cambiar tu core
    const res = await fetch(this["base"] + `/groups/${gid}/members/${userId}/$ref`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Prefer: "HonorNonIndexedQueriesWarningMayFailRandomly",
      },
    });

    if (res.status === 204) return true;  // existe la referencia
    if (res.status === 404) return false; // no es miembro

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`GET /groups/${gid}/members/${userId}/$ref → ${res.status} ${res.statusText}${txt ? `: ${txt}` : ""}`);
    }

    // Por seguridad: algunos tenants podrían devolver 200 con body (raro)
    return true;
  }

  async searchMembersInGroup(groupId: string, emailContains?: string, top: number = 50): Promise<GraphUserLite[]> {
    const gid = (groupId ?? "").trim();
    if (!gid) throw new Error("searchMembersInGroup: groupId vacío");

    const t = Math.max(1, Math.min(top, 999)); // Graph top razonable
    const res = await this.get<{ value: GraphUserLite[] }>(
      `/groups/${gid}/members?$select=id,displayName,mail,userPrincipalName&$top=${t}`
    );

    const items = res?.value ?? [];
    if (!emailContains) return items;

    const q = emailContains.toLowerCase();
    return items.filter(u =>
      (u.mail ?? "").toLowerCase().includes(q) ||
      (u.userPrincipalName ?? "").toLowerCase().includes(q)
    );
  }

  async removeUserFromGroup(groupId: string, email: string): Promise<void> {
    const gid = (groupId ?? "").trim();
    if (!gid) throw new Error("removeUserFromGroup: groupId vacío");

    const userId = await this.getUserIdByEmail(email);

    try {
      await this.delete(`/groups/${gid}/members/${userId}/$ref`);
    } catch (err: any) {
      const msg = String(err?.message ?? err);
      // Si ya no estaba, lo tomamos como ok
      if (msg.includes("404")) return;
      throw err;
    }
  }

}
