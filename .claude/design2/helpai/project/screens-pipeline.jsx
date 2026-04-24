/* Pipeline, Sales, Customers screens */

function ScreenPipeline() {
  const [view, setView] = React.useState("kanban");
  const colColors = {
    "Nouveau": "var(--text-3)",
    "Qualifié": "var(--info)",
    "Devis envoyé": "var(--accent-2)",
    "Négociation": "var(--accent)",
    "Gagné": "var(--success)",
  };
  const totalByCol = Object.fromEntries(
    Object.entries(PIPELINE).map(([k, v]) => [k, v.reduce((s, d) => s + parseInt(d.value.replace(/\D/g, "")), 0)])
  );
  const grandTotal = Object.values(totalByCol).reduce((s, v) => s + v, 0);

  return (
    <div className="stack-lg fade-up">
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <KpiCard label="Pipeline total" value={(grandTotal/1000).toFixed(0)} unit="k €" trend="+34.2k" dir="up"/>
        <KpiCard label="Deals actifs" value={Object.values(PIPELINE).reduce((s, v) => s + v.length, 0)} trend="+4" dir="up"/>
        <KpiCard label="Cycle moyen" value="14.2" unit="j" trend="-2.1j" dir="up"/>
        <KpiCard label="Win rate" value="32.4" unit="%" trend="+1.8pt" dir="up"/>
      </div>

      <div className="row between">
        <div className="row" style={{ gap: 8 }}>
          <div className="seg" style={{ width: 200 }}>
            <button className={view === "kanban" ? "active" : ""} onClick={() => setView("kanban")}>Kanban</button>
            <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>Liste</button>
          </div>
          <button className="chip active">Tous les deals <span className="count">18</span></button>
          <button className="chip">Mes deals <span className="count">7</span></button>
          <button className="chip"><Icon name="filter" size={12}/> Chauds</button>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <div className="search" style={{ minWidth: 220, height: 30 }}>
            <Icon name="search" size={14}/>
            <span>Chercher un deal…</span>
          </div>
          <button className="btn primary"><Icon name="plus" size={14}/> Nouveau deal</button>
        </div>
      </div>

      {view === "kanban" ? (
        <div className="kanban">
          {Object.entries(PIPELINE).map(([col, cards]) => (
            <div key={col} className="kb-col">
              <div className="kb-head">
                <div className="kb-title">
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: colColors[col] }}/>
                  {col}
                </div>
                <span className="kb-count">{cards.length} · {(totalByCol[col]/1000).toFixed(0)}k €</span>
              </div>
              {cards.map((card, i) => (
                <div key={i} className="kb-card">
                  <div className="row between" style={{ marginBottom: 6 }}>
                    <div className="kb-card-title">{card.name}</div>
                    {card.hot && <span style={{ fontSize: 12 }}>🔥</span>}
                  </div>
                  <div className="kb-card-sub">{card.source} · {card.age}</div>
                  <div className="kb-card-meta">
                    <span className={"av"} style={{ width: 22, height: 22, fontSize: 9 }}>{card.owner}</span>
                    <span className="kb-card-value">{card.value}</span>
                  </div>
                </div>
              ))}
              <button className="btn ghost" style={{ width: "100%", justifyContent: "center", color: "var(--text-3)", marginTop: 4 }}>
                <Icon name="plus" size={12}/> Ajouter
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <table className="data">
            <thead>
              <tr>
                <th>Deal</th><th>Statut</th><th>Valeur</th><th>Source</th><th>Owner</th><th>Âge</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(PIPELINE).flatMap(([col, cards]) =>
                cards.map((card, i) => (
                  <tr key={col + i}>
                    <td><strong>{card.name}</strong>{card.hot && " 🔥"}</td>
                    <td><span className="tag" style={{ color: colColors[col], borderColor: colColors[col], background: "transparent" }}>{col}</span></td>
                    <td className="mono">{card.value}</td>
                    <td>{card.source}</td>
                    <td><span className="av" style={{ width: 22, height: 22, fontSize: 9 }}>{card.owner}</span></td>
                    <td className="muted">{card.age}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ============ Sales (analytics) ============ */
function ScreenSales() {
  const SALES_BY_SOURCE = [
    { source: "Meta Ads",      color: "oklch(0.74 0.155 55)",  deals: 142, ca: 718400, ticket: 5060, winRate: 34.2, cycle: 12.4 },
    { source: "Google Ads",    color: "oklch(0.80 0.120 60)",  deals: 86,  ca: 462100, ticket: 5373, winRate: 31.8, cycle: 14.1 },
    { source: "Organique SEO", color: "oklch(0.78 0.13 155)",  deals: 52,  ca: 298900, ticket: 5748, winRate: 41.6, cycle: 16.8 },
    { source: "Referral",      color: "oklch(0.70 0.12 240)",  deals: 40,  ca: 183500, ticket: 4587, winRate: 52.1, cycle: 9.2 },
  ];
  const totalCA = SALES_BY_SOURCE.reduce((s, x) => s + x.ca, 0);

  return (
    <div className="stack-lg fade-up">
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <KpiCard label="CA signé (12m)" value="1 662 900" unit="€" trend="+24.3%" dir="up"/>
        <KpiCard label="Ticket moyen" value="5 196" unit="€" trend="+342€" dir="up"/>
        <KpiCard label="Deals gagnés" value="320" trend="+72" dir="up"/>
        <KpiCard label="Velocity" value="42.1k" unit="€/j" trend="+18.4%" dir="up"/>
      </div>

      {/* Performance commerciale par CANAL D'ACQUISITION (style brief) */}
      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">Performance commerciale par canal</div>
            <div className="card-sub">CA, deals, taux de conversion et cycle moyen — 12 derniers mois</div>
          </div>
          <div className="chips">
            <button className="chip active">CA généré</button>
            <button className="chip">Deals fermés</button>
            <button className="chip">Taux de conversion</button>
          </div>
        </div>
        <table className="data">
          <thead>
            <tr>
              <th>Canal</th>
              <th>Deals</th>
              <th>CA généré</th>
              <th style={{ width: "22%" }}>Part du CA</th>
              <th>Ticket moyen</th>
              <th>Win rate</th>
              <th>Cycle</th>
            </tr>
          </thead>
          <tbody>
            {SALES_BY_SOURCE.map((s, i) => {
              const pct = (s.ca / totalCA) * 100;
              return (
                <tr key={i}>
                  <td>
                    <span className="row" style={{ gap: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color }}/>
                      <strong>{s.source}</strong>
                    </span>
                  </td>
                  <td className="mono">{s.deals}</td>
                  <td className="mono"><strong>{s.ca.toLocaleString("fr")} €</strong></td>
                  <td>
                    <div className="row" style={{ gap: 10 }}>
                      <div className="progress" style={{ flex: 1, maxWidth: 200 }}>
                        <div className="p-accent" style={{ width: pct + "%", background: s.color }}/>
                      </div>
                      <span className="mono small">{pct.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="mono">{s.ticket.toLocaleString("fr")} €</td>
                  <td className="mono" style={{ color: s.winRate > 40 ? "var(--success)" : "var(--text)" }}>
                    {s.winRate.toFixed(1)}%
                  </td>
                  <td className="mono muted">{s.cycle}j</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid g-2">
        <div className="card">
          <div className="card-head">
            <div className="card-title">CA mensuel</div>
            <span className="tag success">+24.3% YoY</span>
          </div>
          <div className="card-body">
            <BarChart
              data={REVENUE_DATA} height={240} xLabels={MONTHS}
              series={[{ key: "ca", color: "var(--accent)" }]}
              yFormat={v => (v/1000).toFixed(0) + "k"}
            />
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <div className="card-title">Taux de conversion par étape</div>
          </div>
          <div className="card-body stack-md">
            {[
              { from: "Lead → Qualifié", value: 64.2 },
              { from: "Qualifié → Devis", value: 58.8 },
              { from: "Devis → Négociation", value: 42.1 },
              { from: "Négociation → Signé", value: 68.4 },
            ].map((s, i) => (
              <div key={i} className="stack-sm">
                <div className="row between" style={{ fontSize: 12.5 }}>
                  <span>{s.from}</span>
                  <span className="mono" style={{ fontWeight: 600 }}>{s.value}%</span>
                </div>
                <div className="progress">
                  <div className="p-accent" style={{ width: s.value + "%" }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ CRM ============ */
function ScreenCustomers() {
  const [tab, setTab] = React.useState("leads");
  const [filter, setFilter] = React.useState("all");
  const filteredCustomers = CUSTOMERS.filter(c => filter === "all" || c.status === filter);

  const sourceColors = {
    "Meta Ads":   "oklch(0.74 0.155 55)",
    "Google Ads": "oklch(0.80 0.120 60)",
    "Organique":  "oklch(0.78 0.13 155)",
    "Referral":   "oklch(0.70 0.12 240)",
  };
  const statusLabel = {
    new: { label: "Nouveau", color: "var(--info)" },
    contacted: { label: "Contacté", color: "var(--accent-2)" },
    qualified: { label: "Qualifié", color: "var(--success)" },
    nurturing: { label: "Nurturing", color: "var(--text-3)" },
  };

  const newToday = INBOUND_LEADS.filter(l => l.time.includes("min") || l.time.includes("4 min")).length;

  return (
    <div className="stack-lg fade-up">
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <KpiCard label="Leads entrants (30j)" value="428" trend="+62" dir="up"/>
        <KpiCard label="Nouveaux aujourd'hui" value={String(8 + newToday)} trend="+3" dir="up"/>
        <KpiCard label="Clients actifs" value="148" trend="+12" dir="up"/>
        <KpiCard label="Santé moyenne" value="82" unit="/100" trend="+3pt" dir="up"/>
      </div>

      <div className="row between">
        <div className="seg" style={{ width: 320 }}>
          <button className={tab === "leads" ? "active" : ""} onClick={() => setTab("leads")}>Leads entrants · {INBOUND_LEADS.length}</button>
          <button className={tab === "clients" ? "active" : ""} onClick={() => setTab("clients")}>Clients · {CUSTOMERS.length}</button>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <div className="search" style={{ minWidth: 240, height: 30 }}>
            <Icon name="search" size={14}/>
            <span>Chercher un contact…</span>
          </div>
          <button className="btn"><Icon name="download" size={13}/> Export CSV</button>
          <button className="btn primary"><Icon name="plus" size={14}/> Nouveau contact</button>
        </div>
      </div>

      {tab === "leads" && (
        <>
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Leads entrants tractés automatiquement</div>
                <div className="card-sub">UTM, source, landing et scoring capturés en temps réel via les automations</div>
              </div>
              <span className="pill live"><span className="dot"/> Tracking actif</span>
            </div>
            <table className="data">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Source</th>
                  <th>Campagne / Landing</th>
                  <th>Score</th>
                  <th>Statut</th>
                  <th>Owner</th>
                  <th>Reçu</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {INBOUND_LEADS.map((l, i) => (
                  <tr key={i}>
                    <td>
                      <div className="row" style={{ gap: 10 }}>
                        <span className={"av" + " av-colors-" + ((i % 4) + 1)} style={{ width: 28, height: 28, fontSize: 10 }}>
                          {l.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </span>
                        <div>
                          <strong style={{ fontSize: 12.5 }}>{l.name}</strong>
                          <div className="small muted">{l.company}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="row" style={{ gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: sourceColors[l.source] || "var(--text-3)" }}/>
                        <span style={{ fontSize: 12.5 }}>{l.source}</span>
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: 12.5 }}>{l.campaign}</div>
                      <div className="small muted mono">{l.landing}</div>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 8 }}>
                        <div className="progress" style={{ width: 50 }}>
                          <div style={{
                            width: l.score + "%", height: "100%", borderRadius: 99,
                            background: l.score > 80 ? "var(--success)" : l.score > 60 ? "var(--accent)" : "var(--text-3)"
                          }}/>
                        </div>
                        <span className="mono" style={{ fontWeight: 600, fontSize: 12 }}>{l.score}</span>
                      </div>
                    </td>
                    <td>
                      <span className="tag" style={{
                        color: statusLabel[l.status].color,
                        borderColor: statusLabel[l.status].color,
                        background: "transparent"
                      }}>{statusLabel[l.status].label}</span>
                    </td>
                    <td>
                      {l.owner === "—"
                        ? <span className="muted small">Non assigné</span>
                        : <span className="av" style={{ width: 22, height: 22, fontSize: 9 }}>{l.owner}</span>}
                    </td>
                    <td className="muted small">{l.time}</td>
                    <td><button className="btn icon ghost"><Icon name="more" size={14}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid g-2">
            <div className="card">
              <div className="card-head">
                <div className="card-title">Volume entrants · 30 derniers jours</div>
                <span className="tag accent">Tracking auto</span>
              </div>
              <div className="card-body">
                <BarChart
                  data={INBOUND_BY_MONTH.slice(-6)} height={220} xLabels={MONTHS.slice(-6)}
                  series={[
                    { key: "meta", color: "var(--accent)" },
                    { key: "google", color: "var(--accent-2)" },
                    { key: "organic", color: "var(--success)" },
                    { key: "referral", color: "var(--info)" },
                  ]}
                />
              </div>
            </div>
            <div className="card">
              <div className="card-head">
                <div className="card-title">Automations de tracking actives</div>
                <span className="mono small muted">5 actives</span>
              </div>
              <div className="card-body stack-md">
                {[
                  { name: "Capture form site→CRM", desc: "Push instantané + scoring + assignation", runs: "1 892" },
                  { name: "Sync Meta Lead Ads", desc: "Webhook — dédoublonnage + UTM", runs: "2 134" },
                  { name: "Sync Google Lead Form", desc: "Polling 60s + enrichissement", runs: "1 421" },
                  { name: "Tracking referral", desc: "Param /?ref + attribution multi-touch", runs: "412" },
                  { name: "Scoring auto", desc: "Recalcul à chaque interaction", runs: "8 547" },
                ].map((a, i) => (
                  <div key={i} className="row" style={{ gap: 12, paddingBottom: 12, borderBottom: i < 4 ? "1px solid var(--border-soft)" : "0" }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <Icon name="zap" size={14}/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 12.5 }}>{a.name}</div>
                      <div className="small muted">{a.desc}</div>
                    </div>
                    <span className="mono small muted">{a.runs}×</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "clients" && (
        <div className="card">
          <div className="card-head">
            <div className="card-title">Portefeuille client</div>
            <div className="chips">
              <button className={"chip " + (filter === "all" ? "active" : "")} onClick={() => setFilter("all")}>Tous <span className="count">{CUSTOMERS.length}</span></button>
              <button className={"chip " + (filter === "ok" ? "active" : "")} onClick={() => setFilter("ok")}>En bonne santé</button>
              <button className={"chip " + (filter === "warn" ? "active" : "")} onClick={() => setFilter("warn")}>À surveiller</button>
              <button className={"chip " + (filter === "bad" ? "active" : "")} onClick={() => setFilter("bad")}>À risque</button>
            </div>
          </div>
          <table className="data">
            <thead>
              <tr>
                <th>Client</th><th>Type</th><th>Valeur</th>
                <th style={{ width: "18%" }}>Santé</th>
                <th>Owner</th><th>Depuis</th><th>Prochaine action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c, i) => (
                <tr key={i}>
                  <td>
                    <span className="row" style={{ gap: 10 }}>
                      <span className="status-dot" data-status={c.status}
                        style={{ background: c.status === "ok" ? "var(--success)" : c.status === "warn" ? "var(--accent)" : "var(--danger)" }}/>
                      <strong>
                        <EditableText value={c.name} tag="span"/>
                      </strong>
                    </span>
                  </td>
                  <td className="muted">{c.type}</td>
                  <td className="mono"><EditableText value={c.value} tag="span"/></td>
                  <td>
                    <div className="row" style={{ gap: 10 }}>
                      <div className="progress" style={{ flex: 1, maxWidth: 140 }}>
                        <div style={{
                          width: c.health + "%", height: "100%", borderRadius: 99,
                          background: c.health > 75 ? "var(--success)" : c.health > 50 ? "var(--accent)" : "var(--danger)"
                        }}/>
                      </div>
                      <span className="mono small">{c.health}</span>
                    </div>
                  </td>
                  <td><span className="av" style={{ width: 22, height: 22, fontSize: 9 }}>{c.owner}</span></td>
                  <td className="muted">{c.since}</td>
                  <td>{c.next === "—" ? <span className="muted">—</span> : <span className="tag"><EditableText value={c.next} tag="span"/></span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

window.ScreenPipeline = ScreenPipeline;
window.ScreenSales = ScreenSales;
window.ScreenCustomers = ScreenCustomers;
