import { useState } from 'react';
import { DISHES, IMAGE_PATHS } from '../data/menu';
import type { Dish } from '../data/menu';
import { DishExperienceSheet } from '../components/DishExperienceSheet';

/** Props: onExit returns to the welcome screen. */
export function DemoModeView({ onExit }: { onExit: () => void }) {
  const [selected, setSelected] = useState<Dish | null>(null);

  return (
    <div className="demo-screen">
      <header className="demo-header">
        <button className="btn-ghost" onClick={onExit}>
          ← Back
        </button>
        <span className="chip demo-chip">Demo mode · no camera</span>
      </header>

      <div className="demo-hero" style={{ backgroundImage: `url(${IMAGE_PATHS.cafeNight})` }}>
        <h1>Tap a dish to preview its board</h1>
        <p>
          Camera AR needs a supported phone pointing at the printed menu. This view previews what
          customers will see once tracking is active. <strong>All reviews, ratings and nutrition are
          sample prototype content.</strong>
        </p>
      </div>

      <div className="demo-grid">
        {DISHES.map((dish) => (
          <button key={dish.id} className="demo-dish" onClick={() => setSelected(dish)}>
            <span className="demo-dish-icon">
              {dish.category === 'Mojitoes' ? '🍹' : dish.category === 'Wraps' ? '🌯' : dish.category === 'Veg Snacks' ? '🥔' : '🍗'}
            </span>
            <span className="demo-dish-name">{dish.name}</span>
            <span className="demo-dish-price">{dish.priceLabel}</span>
          </button>
        ))}
      </div>

      {selected && (
        <DishExperienceSheet
          dish={selected}
          arActive={false}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
