import { animals, type AnimalId } from "./animals";
import { useAnimalRecognizer } from "./hooks/useAnimalRecognizer";

import type { CSSProperties } from "react";

const meadowBackground = "/manus-storage/async-images/BKOMVua1ITKMNeYq3rJsNC/image-1.webp";

function MicrophoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.8 11.2v.8a6.2 6.2 0 0 0 12.4 0v-.8M12 18.2V21m-4 0h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d="M19.7 3.7C11.4 4.1 6 7 6 12.3a4.1 4.1 0 0 0 4.1 4.1c5.3 0 8.2-5.4 8.6-12.7Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M4 20c3.6-5.2 6.6-8 11.4-11.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function App() {
  const {
    status,
    statusMessage,
    feedback,
    visitors,
    newestVisitor,
    arrivalKey,
    startListening,
    stopListening,
    resetMeadow,
  } = useAnimalRecognizer();

  const isListening = status === "listening";
  const isBusy = status === "loading" || status === "requesting";
  const isProblem = status === "denied" || status === "error";
  const confidencePercent = Math.round(Math.max(0, Math.min(feedback.confidence, 1)) * 100);
  const visitorCount = visitors.length;

  function toggleListening() {
    if (isListening) stopListening();
    else void startListening();
  }

  function visitorKey(id: AnimalId, index: number) {
    return `${id}-${index}-${id === newestVisitor ? arrivalKey : 0}`;
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="./" aria-label="Wildcall home">
          <img src="./assets/wildcall-mark.svg" alt="" className="brand-mark" />
          <span className="brand-name">wildcall<span>.</span></span>
        </a>
        <div className="topbar-note">
          <span className={`live-dot ${isListening ? "live-dot--on" : ""}`} />
          <span>{isListening ? "Meadow is listening" : "A little call goes a long way"}</span>
        </div>
      </header>

      <main className="page-content">
        <section className="intro" aria-labelledby="page-title">
          <div className="intro-copy">
            <p className="eyebrow"><LeafIcon /> A SMALL SOUND ADVENTURE</p>
            <h1 id="page-title">Call softly.<br /><em>See who visits.</em></h1>
            <p className="intro-description">Make an animal sound and invite a woodland friend into the clearing.</p>
          </div>
          <div className="call-count" aria-label={`${7 - visitorCount} of 7 animal friends still to find`}>
            <span className="count-number">{String(visitorCount).padStart(2, "0")}</span>
            <span className="count-copy">of 07<br />friends found</span>
          </div>
        </section>

        <section className="experience-layout" aria-label="Animal call experience">
          <div className="meadow-card">
            <div className="meadow-scene" style={{ backgroundImage: `linear-gradient(180deg, rgba(23, 47, 37, .08), rgba(31, 52, 40, .07)), url("${meadowBackground}"), url("./assets/woodland-fallback.svg")` }}>
              <div className="scene-sun-glow" aria-hidden="true" />
              <div className="scene-label">
                <span className="scene-label-icon"><LeafIcon /></span>
                <span>THE WOODLAND MEADOW</span>
              </div>
              <div className="scene-counter"><span className="counter-sparkle">✳</span> {visitorCount === 0 ? "A quiet little clearing" : `${visitorCount} ${visitorCount === 1 ? "friend" : "friends"} visiting`}</div>

              {visitorCount === 0 ? (
                <div className="scene-invitation" aria-live="polite">
                  <span className="invitation-orbit invitation-orbit--one" />
                  <span className="invitation-orbit invitation-orbit--two" />
                  <span className="invitation-leaf"><LeafIcon /></span>
                  <span>There’s room for a friend</span>
                </div>
              ) : (
                <div className="arrival-row" aria-live="polite" aria-label={`${visitorCount} animal ${visitorCount === 1 ? "visitor" : "visitors"} in the meadow`}>
                  {visitors.map((id, index) => {
                    const animal = animals.find((item) => item.id === id)!;
                    return (
                      <figure
                        className={`arrival-animal ${id === newestVisitor ? "arrival-animal--fresh" : ""}`}
                        key={visitorKey(id, index)}
                        style={{ "--animal-accent": animal.accent, "--arrival-delay": `${Math.min(index * 85, 420)}ms` } as CSSProperties}
                      >
                        <span className="animal-shadow" aria-hidden="true" />
                        <span className="animal-emoji" aria-hidden="true" hidden>{animal.emoji}</span>
                        <img
                          src={animal.image}
                          alt={`${animal.name} visiting the woodland meadow`}
                          onError={(event) => {
                            event.currentTarget.hidden = true;
                            const fallback = event.currentTarget.previousElementSibling;
                            if (fallback instanceof HTMLElement) fallback.hidden = false;
                          }}
                        />
                        <figcaption>{animal.name}</figcaption>
                      </figure>
                    );
                  })}
                </div>
              )}

              <div className="scene-ground" aria-hidden="true" />
              <div className="scene-footer">
                <span className="scene-safety"><span className="scene-safety-dot" /> Sound stays on your device</span>
                <span className="scene-footer-right">A meadow made for listening</span>
              </div>
            </div>
            <div className="animal-trail" aria-label="Animals this model can recognize">
              <div className="trail-heading">
                <span>CALL NOTES</span>
                <span className="trail-hint">Try a sound like…</span>
              </div>
              <div className="animal-chips">
                {animals.map((animal) => (
                  <span className={`animal-chip ${visitors.includes(animal.id) ? "animal-chip--found" : ""}`} key={animal.id}>
                    <span className="chip-dot" style={{ backgroundColor: animal.accent }} />
                    <span>{animal.name}</span>
                    <span className="chip-call">{animal.call}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <aside className="listening-panel" aria-label="Listening controls">
            <div className="panel-heading">
              <span className="panel-kicker">YOUR TURN</span>
              <h2>Call into<br />the grove.</h2>
              <p>Make a cat, cow, dog, duck, sheep, owl, or pig sound. I’ll look for a match.</p>
            </div>

            <div className={`status-card status-card--${feedback.tone}`} aria-live="polite">
              <div className="status-card-top">
                <span className={`status-indicator ${isListening ? "status-indicator--pulse" : ""}`} />
                <span className="status-label">{isBusy ? "GETTING READY" : isListening ? "LIVE LISTENING" : isProblem ? "NEEDS A MOMENT" : "LIVE RECOGNITION"}</span>
                <span className="status-confidence">{feedback.confidence > 0 ? `${confidencePercent}%` : "···"}</span>
              </div>
              <p className="status-title">{isProblem ? (status === "denied" ? "Microphone permission needed" : "The grove is quiet") : feedback.title}</p>
              <p className="status-detail">{isProblem ? statusMessage : feedback.detail}</p>
              <div className="confidence-track" role="progressbar" aria-label="Current sound match confidence" aria-valuenow={confidencePercent} aria-valuemin={0} aria-valuemax={100}>
                <span style={{ width: `${confidencePercent}%` }} />
              </div>
              <div className="status-footnote">
                <span>{feedback.label}</span>
                <span>{isListening ? "Say it again to invite" : "Your call stays private"}</span>
              </div>
            </div>

            <button className={`listen-button ${isListening ? "listen-button--active" : ""}`} onClick={toggleListening} disabled={isBusy}>
              <span className="listen-icon"><MicrophoneIcon /></span>
              <span className="listen-button-copy">
                <strong>{isBusy ? (status === "loading" ? "Preparing model…" : "Waiting for permission…") : isListening ? "Stop listening" : status === "denied" ? "Try microphone again" : status === "error" ? "Try again" : "Start listening"}</strong>
                <small>{isBusy ? "Just a moment" : isListening ? "Tap when you’re ready to pause" : "Your browser will ask first"}</small>
              </span>
              <span className="button-arrow" aria-hidden="true">{isListening ? "Ⅱ" : "↗"}</span>
            </button>

            <div className="mic-note">
              <span className="mic-note-icon"><MicrophoneIcon /></span>
              <p>{statusMessage}</p>
            </div>

            <div className="panel-divider" />
            <div className="steps-heading"><span>HOW TO CALL A FRIEND</span><button type="button" className="reset-button" onClick={resetMeadow} disabled={visitorCount === 0}>Reset meadow <span aria-hidden="true">↺</span></button></div>
            <ol className="how-steps">
              <li><span className="step-number">01</span><span>Start listening</span></li>
              <li><span className="step-number">02</span><span>Make an animal sound</span></li>
              <li><span className="step-number">03</span><span>Meet your new friend</span></li>
            </ol>
            <p className="privacy-note"><span className="privacy-mark">◌</span> Your voice is analyzed here and never recorded or uploaded.</p>
          </aside>
        </section>

        <footer className="page-footer">
          <span>Made for curious ears <span aria-hidden="true">·</span> Built with a little woodland magic</span>
          <span className="footer-model"><span className="footer-model-dot" /> Model ready in your browser</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
