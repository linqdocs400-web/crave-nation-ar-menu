import { DISHES, IMAGE_PATHS } from '../data/menu';

export function WelcomeScreen({ onExplore }: { onExplore: () => void }) {
  const support =
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices != null &&
    typeof navigator.mediaDevices.getUserMedia === 'function';

  return (
    <div className="welcome">
      <div className="welcome-photo" style={{ backgroundImage: `url(${IMAGE_PATHS.cafeNight})` }}>
        <div className="welcome-scrim" />
        <div className="welcome-brand">
          <span className="brand-crown">👑</span>
          <h1>Crave Nation</h1>
          <p>AR Menu · Prototype</p>
        </div>
      </div>

      <div className="welcome-body">
        <p className="welcome-tagline">
          Scan your menu, tap a dish, and bring your cravings to life.
        </p>

        <ol className="howto">
          <li>
            <span className="howto-num">1</span>
            <div>
              <strong>Point at the menu</strong>
              <small>Hold your phone over the printed Crave Nation menu.</small>
            </div>
          </li>
          <li>
            <span className="howto-num">2</span>
            <div>
              <strong>Tap a dish</strong>
              <small>Tap right on the dish photo on the physical menu.</small>
            </div>
          </li>
          <li>
            <span className="howto-num">3</span>
            <div>
              <strong>Watch it float</strong>
              <small>Your food comes to life with reviews, ratings &amp; fun.</small>
            </div>
          </li>
        </ol>

        {support ? (
          <button className="btn-primary" onClick={onExplore}>
            📷 Explore AR Menu
          </button>
        ) : (
          <div className="compat-note">
            <button className="btn-primary" onClick={onExplore} disabled={false}>
              Explore in demo mode
            </button>
            <small>
              This browser/device can’t access a camera over HTTPS. Demo mode previews the full
              experience without the live feed.
            </small>
          </div>
        )}

        <div className="welcome-dishes">
          <span className="welcome-dishes-title">Featured in the demo</span>
          <div className="welcome-dishes-row">
            {DISHES.slice(0, 5).map((d) => (
              <span key={d.id} className="welcome-chip">
                {d.name}
              </span>
            ))}
            <span className="welcome-chip welcome-chip-more">+ more</span>
          </div>
        </div>

        <small className="prototype-note">
          Prototype demo. Sample reviews, demo ratings and estimated nutrition are clearly labelled
          in-app and are not real customer feedback or verified data. Menu prices are the existing
          prices printed on the supplied Crave Nation menu.
        </small>
      </div>
    </div>
  );
}
