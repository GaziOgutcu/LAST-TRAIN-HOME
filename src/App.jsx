
import React, { useMemo, useState } from "react";
import "./styles.css";

const STATIONS = [
  "Ame-no-Gate",
  "Old Market",
  "Kisaragi Junction",
  "Platform 5",
  "Floodline",
  "Hollow Yard",
  "North Terminal",
  "Last Stop"
];

const ANOMALIES = {
  NONE: "none",
  NO_BLINK: "no_blink",
  WRONG_DESTINATION: "wrong_destination",
  OLD_TICKET: "old_ticket",
  REFLECTION: "reflection",
  DUPLICATE: "duplicate",
  SELF: "self"
};

const BASE_PASSENGERS = [
  {
    name: "Sato Yuki",
    archetype: "Office Worker",
    mood: "Tired",
    seat: "A2",
    destination: 5,
    ticketTime: "23:47",
    anomaly: ANOMALIES.NONE,
    dialogue: "Long shift. I just want to get home.",
    clues: ["Blinks normally.", "Shadow matches posture.", "Reflection checks out."]
  },
  {
    name: "Tanaka Hiroshi",
    archetype: "Raincoat Man",
    mood: "Still",
    seat: "C1",
    destination: 7,
    ticketTime: "23:52",
    anomaly: ANOMALIES.NO_BLINK,
    dialogue: "Of course, conductor.",
    clues: ["Has not blinked once.", "Smile held too long.", "Reflection checks out."]
  },
  {
    name: "Nakamura Aoi",
    archetype: "Student",
    mood: "Distracted",
    seat: "B4",
    destination: 3,
    ticketTime: "23:38",
    anomaly: ANOMALIES.WRONG_DESTINATION,
    dialogue: "I am going to Platform 5. I am going to Platform 5.",
    clues: ["Ticket destination has already passed.", "Repeats the same answer.", "Hands tremble only when watched."]
  },
  {
    name: "Mori Daichi",
    archetype: "Nurse",
    mood: "Calm",
    seat: "D2",
    destination: 8,
    ticketTime: "20:14",
    anomaly: ANOMALIES.OLD_TICKET,
    dialogue: "Is the night always this long?",
    clues: ["Ticket timestamp is three years old.", "Uniform is dry despite the rain.", "Pulse visible at the neck."]
  },
  {
    name: "Ito Ren",
    archetype: "Courier",
    mood: "Anxious",
    seat: "A5",
    destination: 8,
    ticketTime: "00:06",
    anomaly: ANOMALIES.REFLECTION,
    dialogue: "Do not look at the window behind me.",
    clues: ["Reflection is standing while body is seated.", "Package label has your name.", "Blinks normally."]
  },
  {
    name: "Sato Yuki",
    archetype: "Office Worker",
    mood: "Too Familiar",
    seat: "C3",
    destination: 8,
    ticketTime: "00:11",
    anomaly: ANOMALIES.DUPLICATE,
    dialogue: "You have not met me before.",
    clues: ["Same face as a prior passenger.", "Ticket uses a different serial format.", "Does not remember boarding earlier."]
  },
  {
    name: "Mizuno Hana",
    archetype: "Tourist",
    mood: "Lost",
    seat: "B1",
    destination: 8,
    ticketTime: "00:18",
    anomaly: ANOMALIES.NONE,
    dialogue: "I think I missed my stop. Sorry.",
    clues: ["Ticket is valid.", "Voice shakes naturally.", "Reflection checks out."]
  },
  {
    name: "Conductor",
    archetype: "You",
    mood: "Patient",
    seat: "A1",
    destination: 8,
    ticketTime: "--:--",
    anomaly: ANOMALIES.SELF,
    dialogue: "You are late for inspection.",
    clues: ["Same uniform as yours.", "Carries your clipboard.", "Ticket field is blank."]
  }
];

function buildManifest(stationIndex) {
  const normalPool = BASE_PASSENGERS.filter((p) => p.anomaly === ANOMALIES.NONE);
  const anomaliesByStation = {
    1: [],
    2: [],
    3: [ANOMALIES.NO_BLINK],
    4: [ANOMALIES.WRONG_DESTINATION],
    5: [ANOMALIES.OLD_TICKET],
    6: [ANOMALIES.REFLECTION],
    7: [ANOMALIES.DUPLICATE],
    8: [ANOMALIES.SELF]
  };

  const anomalyPassengers = BASE_PASSENGERS.filter((p) =>
    anomaliesByStation[stationIndex]?.includes(p.anomaly)
  );

  const count = stationIndex < 3 ? 2 : stationIndex < 6 ? 3 : 4;
  const passengers = [...anomalyPassengers];

  for (let i = 0; passengers.length < count; i += 1) {
    const source = normalPool[(stationIndex + i) % normalPool.length];
    passengers.push({
      ...source,
      name: i === 0 && stationIndex > 5 ? "Kobayashi Mio" : source.name,
      seat: ["A2", "B3", "C1", "D4"][i % 4],
      ticketTime: `23:${String(40 + stationIndex + i).padStart(2, "0")}`,
      destination: Math.min(8, stationIndex + 2 + (i % 2)),
      id: `${stationIndex}-${i}-${source.name}`
    });
  }

  return passengers.map((p, index) => ({
    ...p,
    id: `${stationIndex}-${index}-${p.name}-${p.anomaly}`,
    inspected: false,
    resolved: false
  }));
}

function stressLabel(stress) {
  if (stress >= 85) return "UNSTABLE";
  if (stress >= 60) return "PARANOID";
  if (stress >= 30) return "UNEASY";
  return "BASELINE";
}

function endingFor({ stress, correct, missed, deniedNormal }) {
  if (stress >= 100) {
    return {
      title: "Psychological Collapse",
      detail: "The train arrives empty. Your clipboard lists only one passenger: you."
    };
  }
  if (missed >= 3) {
    return {
      title: "Anomaly Truth",
      detail: "The final station opens onto the same carriage. The passengers applaud without blinking."
    };
  }
  if (correct >= 7 && deniedNormal <= 1) {
    return {
      title: "Survived the Last Stop",
      detail: "You step onto the platform at dawn. The rain stops exactly when you let go of the ticket punch."
    };
  }
  return {
    title: "Doubtful Arrival",
    detail: "You reach the terminal, but the route map still shows one more station."
  };
}

export default function App() {
  const [mode, setMode] = useState("menu");
  const [station, setStation] = useState(1);
  const [manifest, setManifest] = useState(() => buildManifest(1));
  const [selected, setSelected] = useState(null);
  const [questioned, setQuestioned] = useState(false);
  const [log, setLog] = useState(["Rain strikes the roof. The first doors open."]);
  const [stats, setStats] = useState({
    correct: 0,
    mistakes: 0,
    missed: 0,
    deniedNormal: 0,
    stress: 8
  });

  const ending = useMemo(() => endingFor(stats), [stats]);

  const unresolvedCount = manifest.filter((p) => !p.resolved).length;
  const progress = Math.round((station / STATIONS.length) * 100);
  const best = Number(localStorage.getItem("lth_best_score") || 0);

  const begin = () => {
    setMode("playing");
    setStation(1);
    setManifest(buildManifest(1));
    setSelected(null);
    setQuestioned(false);
    setStats({ correct: 0, mistakes: 0, missed: 0, deniedNormal: 0, stress: 8 });
    setLog(["Rain strikes the roof. The first doors open."]);
  };

  const selectPassenger = (passenger) => {
    setSelected(passenger);
    setQuestioned(false);
  };

  const addLog = (line) => setLog((prev) => [line, ...prev].slice(0, 6));

  const decide = (decision) => {
    if (!selected) return;
    const isAnomaly = selected.anomaly !== ANOMALIES.NONE;
    const correct = (decision === "deny" && isAnomaly) || (decision === "allow" && !isAnomaly);
    const stressDelta = correct ? (isAnomaly ? -8 : -3) : 14;
    const deniedNormal = decision === "deny" && !isAnomaly ? 1 : 0;
    const missed = decision === "allow" && isAnomaly ? 1 : 0;

    setStats((s) => {
      const next = {
        correct: s.correct + (correct ? 1 : 0),
        mistakes: s.mistakes + (correct ? 0 : 1),
        missed: s.missed + missed,
        deniedNormal: s.deniedNormal + deniedNormal,
        stress: Math.max(0, Math.min(100, s.stress + stressDelta))
      };
      return next;
    });

    addLog(
      correct
        ? `${selected.name}: ${decision === "deny" ? "denied" : "allowed"} — correct call.`
        : `${selected.name}: ${decision === "deny" ? "denied" : "allowed"} — something feels wrong.`
    );

    setManifest((list) =>
      list.map((p) => (p.id === selected.id ? { ...p, inspected: true, resolved: true } : p))
    );
    setSelected(null);
    setQuestioned(false);
  };

  const depart = () => {
    const missedThisStop = manifest.filter((p) => !p.resolved && p.anomaly !== ANOMALIES.NONE).length;
    const ignored = manifest.filter((p) => !p.resolved).length;
    const stressPenalty = missedThisStop * 12 + Math.max(0, ignored - missedThisStop) * 3;

    const nextStats = {
      ...stats,
      missed: stats.missed + missedThisStop,
      mistakes: stats.mistakes + missedThisStop,
      stress: Math.min(100, stats.stress + stressPenalty + (station >= 6 ? 5 : 0))
    };

    setStats(nextStats);

    if (nextStats.stress >= 100 || station === STATIONS.length) {
      const score = Math.max(0, nextStats.correct * 100 - nextStats.mistakes * 45 - nextStats.deniedNormal * 15);
      localStorage.setItem("lth_best_score", String(Math.max(best, score)));
      setMode("ending");
      return;
    }

    const nextStation = station + 1;
    setStation(nextStation);
    setManifest(buildManifest(nextStation));
    setSelected(null);
    setQuestioned(false);
    addLog(
      missedThisStop > 0
        ? "The doors shut. Someone you ignored is now reflected in every window."
        : "The doors shut. The rails sing under the rain."
    );
  };

  const stressClass = `stress-${Math.floor(stats.stress / 25)}`;

  return (
    <main className={`app ${stressClass}`}>
      <div className="rain" />
      <div className="scanlines" />

      {mode === "menu" && (
        <section className="menu panel">
          <p className="eyebrow">Psychological inspection horror · web prototype</p>
          <h1>Last Train Home</h1>
          <p>
            You are the conductor on the final midnight line. Inspect passengers, verify
            their tickets, and deny anything that is not human before the terminal station.
          </p>
          <button className="primary" onClick={begin}>Start demo run</button>
          <div className="menu-grid">
            <span>8 stations</span>
            <span>Hidden stress</span>
            <span>Procedural-feeling anomalies</span>
            <span>Vercel-ready</span>
          </div>
        </section>
      )}

      {mode === "playing" && (
        <>
          <header className="hud">
            <div>
              <p className="eyebrow">Station {station} / {STATIONS.length}</p>
              <h2>{STATIONS[station - 1]}</h2>
            </div>
            <div className="route">
              <div className="route-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="status">
              <span>Stress: {stressLabel(stats.stress)}</span>
              <span>Unresolved: {unresolvedCount}</span>
            </div>
          </header>

          <section className="train">
            <div className="window">
              <span>{station >= 6 && stats.stress > 45 ? "your reflection is late" : "rain / tunnel / light"}</span>
            </div>
            <div className="carriage">
              {manifest.map((p) => (
                <button
                  key={p.id}
                  className={`passenger ${p.resolved ? "resolved" : ""} ${p.anomaly !== ANOMALIES.NONE ? "maybe" : ""}`}
                  onClick={() => selectPassenger(p)}
                  disabled={p.resolved}
                  title={`Inspect ${p.name}`}
                >
                  <span className="head">{stats.stress > 70 && !p.resolved ? "● ●" : "• •"}</span>
                  <span className="body">{p.archetype}</span>
                  <small>Seat {p.seat}</small>
                </button>
              ))}
            </div>
            <div className="doors">
              <button className="depart" onClick={depart}>
                Depart to next station
              </button>
            </div>
          </section>

          <aside className="clipboard">
            <h3>Conductor Log</h3>
            {log.map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}
            <div className="stats">
              <span>Correct {stats.correct}</span>
              <span>Mistakes {stats.mistakes}</span>
              <span>Missed {stats.missed}</span>
            </div>
          </aside>
        </>
      )}

      {selected && (
        <section className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="inspection panel" onClick={(event) => event.stopPropagation()}>
            <div className="inspection-top">
              <div>
                <p className="eyebrow">Inspection mode</p>
                <h2>{selected.name}</h2>
              </div>
              <button className="ghost" onClick={() => setSelected(null)}>Close</button>
            </div>

            <div className="ticket">
              <div>
                <strong>Ticket holder</strong>
                <span>{selected.name}</span>
              </div>
              <div>
                <strong>Destination</strong>
                <span>{STATIONS[selected.destination - 1] || "Unknown"}</span>
              </div>
              <div>
                <strong>Issued</strong>
                <span>{selected.ticketTime}</span>
              </div>
              <div>
                <strong>Seat</strong>
                <span>{selected.seat}</span>
              </div>
            </div>

            <div className="observations">
              <h3>Observed details</h3>
              <ul>
                {selected.clues.map((clue) => (
                  <li key={clue}>{stats.stress > 75 && selected.anomaly === ANOMALIES.NONE ? `${clue} Or did it?` : clue}</li>
                ))}
              </ul>
            </div>

            {questioned ? (
              <blockquote>“{selected.dialogue}”</blockquote>
            ) : (
              <button className="secondary" onClick={() => setQuestioned(true)}>Question passenger</button>
            )}

            <div className="actions">
              <button className="allow" onClick={() => decide("allow")}>Allow</button>
              <button className="deny" onClick={() => decide("deny")}>Deny</button>
            </div>
          </div>
        </section>
      )}

      {mode === "ending" && (
        <section className="ending panel">
          <p className="eyebrow">Run complete</p>
          <h1>{ending.title}</h1>
          <p>{ending.detail}</p>
          <div className="score-card">
            <span>Correct calls: {stats.correct}</span>
            <span>Mistakes: {stats.mistakes}</span>
            <span>Missed anomalies: {stats.missed}</span>
            <span>Final stress: {stats.stress}</span>
            <span>Best score: {Math.max(best, Math.max(0, stats.correct * 100 - stats.mistakes * 45 - stats.deniedNormal * 15))}</span>
          </div>
          <button className="primary" onClick={begin}>Ride again</button>
        </section>
      )}
    </main>
  );
}
