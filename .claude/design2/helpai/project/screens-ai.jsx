/* AI Activity, Automations, Integrations, Team screens */

function ScreenAI() {
  return (
    <div className="stack-lg fade-up">
      <div className="hero-panel">
        <div>
          <div className="row" style={{ gap: 8, marginBottom: 6 }}>
            <span className="tag accent"><Icon name="sparkles" size={10}/> Agent HelpAi</span>
            <span className="pill live"><span className="dot"/> Actif 24/7</span>
          </div>
          <div className="hp-title">L'IA a traité 8 547 tâches ce mois — équivalent à 14.2 jours de travail humain.</div>
          <div className="hp-sub">Qualification de leads, relances, scoring, réponses first-touch, collecte d'avis — tout tourne en continu.</div>
        </div>
        <button className="btn primary"><Icon name="plus" size={14}/> Nouvelle compétence</button>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <KpiCard label="Tâches traitées" value="8 547" trend="+1 204" dir="up"/>
        <KpiCard label="Temps économisé" value="14.2" unit="jours" trend="+3.1j" dir="up"/>
        <KpiCard label="Taux de succès" value="96.4" unit="%" trend="+0.8pt" dir="up"/>
        <KpiCard label="Escalades humaines" value="142" trend="-18" dir="up"/>
      </div>

      <div className="grid g-2-1">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Activité de l'agent (24h)</div>
            <div className="chart-legend">
              <span className="lg" style={{ color: "var(--accent)" }}><span className="sw"/> Tâches</span>
              <span className="lg" style={{ color: "var(--success)" }}><span className="sw"/> Succès</span>
            </div>
          </div>
          <div className="card-body">
            <LineChart
              data={Array.from({ length: 24 }, (_, i) => ({
                m: i + "h",
                tasks: 80 + Math.sin(i / 3) * 60 + Math.random() * 40 + (i > 8 && i < 20 ? 80 : 0),
                success: 75 + Math.sin(i / 3) * 55 + Math.random() * 35 + (i > 8 && i < 20 ? 78 : 0),
              }))}
              height={260}
              xLabels={Array.from({ length: 24 }, (_, i) => i + "h")}
              series={[
                { key: "tasks", label: "Tâches", color: "var(--accent)", fmt: v => Math.round(v) },
                { key: "success", label: "Succès", color: "var(--success)", fmt: v => Math.round(v) },
              ]}
              yFormat={v => Math.round(v)}
            />
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">Compétences actives</div>
          </div>
          <div className="card-body stack-md">
            {[
              { n: "Qualification lead", c: 2841, color: "var(--accent)" },
              { n: "Relance devis", c: 487, color: "var(--accent-2)" },
              { n: "Scoring chaud", c: 1892, color: "var(--success)" },
              { n: "Réponse first-touch", c: 2104, color: "var(--info)" },
              { n: "Collecte avis", c: 628, color: "oklch(0.65 0.15 310)" },
              { n: "Reporting hebdo", c: 38, color: "var(--text-3)" },
            ].map((s, i) => (
              <div key={i} className="stack-sm">
                <div className="row between">
                  <span style={{ fontSize: 12.5, fontWeight: 500 }}>{s.n}</span>
                  <span className="mono small">{s.c.toLocaleString("fr")}</span>
                </div>
                <div className="progress">
                  <div style={{ width: Math.min(100, (s.c / 3000) * 100) + "%", height: "100%", background: s.color, borderRadius: 99 }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title">Conversations récentes de l'agent</div>
          <span className="pill live"><span className="dot"/> Temps réel</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {[
            { lead: "Marie Dubois", msg: "Intéressée par un audit climatisation pour un local de 280m²", score: 92, action: "RDV proposé lundi 14h", time: "il y a 3 min" },
            { lead: "Pascal Vincent", msg: "Demande un devis pour 4 sites — groupe hôtelier", score: 88, action: "Escaladé à Thomas R.", time: "il y a 14 min" },
            { lead: "Café Central", msg: "N'a pas répondu à la relance J+3", score: 54, action: "Nouvelle relance programmée J+7", time: "il y a 42 min" },
            { lead: "Dr. Petit", msg: "Souhaite annuler son contrat — insatisfait", score: 18, action: "Escaladé à Nicolas B.", time: "il y a 1h" },
          ].map((c, i) => (
            <div key={i} style={{ padding: "14px 18px", borderBottom: i < 3 ? "1px solid var(--border-soft)" : "0" }}>
              <div className="row between" style={{ marginBottom: 6 }}>
                <div className="row" style={{ gap: 10 }}>
                  <span className={"av av-colors-" + ((i % 4) + 1)}>{c.lead.split(" ").map(x => x[0]).join("").slice(0, 2)}</span>
                  <strong>{c.lead}</strong>
                  <span className="tag accent">Score {c.score}</span>
                </div>
                <span className="mono small muted">{c.time}</span>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 6 }}>"{c.msg}"</div>
              <div className="row" style={{ gap: 8 }}>
                <Icon name="arrow" size={12} className="muted"/>
                <span className="small" style={{ color: "var(--accent)", fontWeight: 500 }}>{c.action}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScreenAutomations() {
  const [tab, setTab] = React.useState("all");
  return (
    <div className="stack-lg fade-up">
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <KpiCard label="Workflows actifs" value="24" trend="+3" dir="up"/>
        <KpiCard label="Exécutions (30j)" value="6 587" trend="+892" dir="up"/>
        <KpiCard label="Taux de succès" value="94.7" unit="%" trend="+1.2pt" dir="up"/>
        <KpiCard label="Temps gagné" value="218" unit="h" trend="+42h" dir="up"/>
      </div>

      <div className="row between">
        <div className="chips">
          {[["all","Tous",24],["on","Actifs",21],["paused","Pause",3],["draft","Brouillons",5]].map(([k,l,n]) => (
            <button key={k} className={"chip " + (tab === k ? "active" : "")} onClick={() => setTab(k)}>
              {l} <span className="count">{n}</span>
            </button>
          ))}
        </div>
        <button className="btn primary"><Icon name="plus" size={14}/> Créer un workflow</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="data">
          <thead>
            <tr>
              <th>Workflow</th><th>Déclencheur</th><th>Exécutions</th>
              <th style={{ width: "18%" }}>Succès</th>
              <th>Dernière</th><th>État</th><th></th>
            </tr>
          </thead>
          <tbody>
            {AUTOMATIONS.map((a, i) => (
              <tr key={i}>
                <td><strong>{a.name}</strong></td>
                <td><code className="code">{a.trigger}</code></td>
                <td className="mono">{a.runs.toLocaleString("fr")}</td>
                <td>
                  <div className="row" style={{ gap: 10 }}>
                    <div className="progress" style={{ flex: 1, maxWidth: 120 }}>
                      <div className={a.success > 90 ? "p-success" : "p-accent"} style={{ width: a.success + "%" }}/>
                    </div>
                    <span className="mono small">{a.success}%</span>
                  </div>
                </td>
                <td className="muted small">{a.last}</td>
                <td>
                  {a.status === "on"
                    ? <span className="tag success"><span className="status-dot ok"/> Actif</span>
                    : <span className="tag"><span className="status-dot off"/> Pause</span>}
                </td>
                <td>
                  <button className="btn icon ghost">
                    <Icon name={a.status === "on" ? "pause" : "play"} size={13}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScreenIntegrations() {
  const [filter, setFilter] = React.useState("all");
  const cats = [...new Set(INTEGRATIONS.map(i => i.cat))];
  const filtered = filter === "all" ? INTEGRATIONS : INTEGRATIONS.filter(i => i.cat === filter);
  return (
    <div className="stack-lg fade-up">
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <KpiCard label="Connectées" value="10" unit={`/ ${INTEGRATIONS.length}`} trend="+2" dir="up"/>
        <KpiCard label="Événements (30j)" value="76 218" trend="+12 480" dir="up"/>
        <KpiCard label="Disponibilité" value="99.98" unit="%" trend="stable" dir="flat"/>
      </div>

      <div className="row between">
        <div className="chips">
          <button className={"chip " + (filter === "all" ? "active" : "")} onClick={() => setFilter("all")}>Tout</button>
          {cats.map(c => (
            <button key={c} className={"chip " + (filter === c ? "active" : "")} onClick={() => setFilter(c)}>{c}</button>
          ))}
        </div>
        <div className="search" style={{ minWidth: 240, height: 30 }}>
          <Icon name="search" size={14}/>
          <span>Chercher une intégration…</span>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {filtered.map((it, i) => (
          <div key={i} className="card" style={{ padding: 16 }}>
            <div className="row between" style={{ marginBottom: 12 }}>
              <div className="row" style={{ gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: "var(--surface-2)",
                  border: "1px solid var(--border-soft)",
                  display: "grid", placeItems: "center",
                  fontFamily: "var(--font-display)", fontWeight: 700,
                  fontSize: 13, color: "var(--text)"
                }}>
                  {it.name.split(" ").map(x => x[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{it.name}</div>
                  <div className="small muted">{it.cat}</div>
                </div>
              </div>
              {it.status === "connected" && <span className="status-dot ok"/>}
            </div>
            <div className="small muted" style={{ marginBottom: 10, minHeight: 18 }}>
              {it.status === "connected"
                ? <>Dernière sync : <strong style={{ color: "var(--text-2)" }}>{it.last}</strong></>
                : it.status === "disconnected" ? "Connexion perdue" : "Disponible à installer"}
            </div>
            <div className="row between">
              <span className="small mono muted">{it.events !== "—" ? it.events + " évts" : "—"}</span>
              {it.status === "connected"
                ? <button className="btn" style={{ height: 26, fontSize: 11 }}>Configurer</button>
                : it.status === "disconnected"
                ? <button className="btn primary" style={{ height: 26, fontSize: 11 }}>Reconnecter</button>
                : <button className="btn" style={{ height: 26, fontSize: 11 }}>Installer</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScreenTeam() {
  return (
    <div className="stack-lg fade-up">
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <KpiCard label="Équipiers" value="5" trend="+1" dir="up"/>
        <KpiCard label="Productivité" value="94" unit="%" trend="+4pt" dir="up"/>
        <KpiCard label="RDV cette semaine" value="68" trend="+12" dir="up"/>
        <KpiCard label="Quota atteint" value="3" unit="/ 5" trend="—" dir="flat"/>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {TEAM.map((t, i) => (
          <div key={i} className="card" style={{ padding: 18 }}>
            <div className="row" style={{ gap: 12, marginBottom: 14 }}>
              <span className={"av lg av-colors-" + ((i % 4) + 1)}>{t.initials}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                <div className="small muted">{t.role}</div>
              </div>
            </div>
            <div className="grid g-2" style={{ gap: 8, marginBottom: 12 }}>
              <div>
                <div className="small muted">Deals</div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 700 }}>{t.deals}</div>
              </div>
              <div>
                <div className="small muted">CA généré</div>
                <div className="mono" style={{ fontSize: 14, fontWeight: 700 }}>{t.ca}</div>
              </div>
            </div>
            <div className="stack-sm">
              <div className="row between small">
                <span className="muted">Charge de travail</span>
                <span className="mono">{t.load}%</span>
              </div>
              <div className="progress">
                <div style={{ width: t.load + "%", height: "100%", background: t.load > 85 ? "var(--danger)" : t.load > 60 ? "var(--accent)" : "var(--success)", borderRadius: 99 }}/>
              </div>
            </div>
          </div>
        ))}
        <div className="card" style={{ padding: 18, border: "1px dashed var(--border)", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 180, cursor: "pointer" }}>
          <div style={{ textAlign: "center", color: "var(--text-3)" }}>
            <Icon name="plus" size={20}/>
            <div style={{ marginTop: 8, fontSize: 13, fontWeight: 500 }}>Inviter un équipier</div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.ScreenAI = ScreenAI;
window.ScreenAutomations = ScreenAutomations;
window.ScreenIntegrations = ScreenIntegrations;
window.ScreenTeam = ScreenTeam;
