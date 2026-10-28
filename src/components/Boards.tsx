import { useEffect, useState } from 'react';
import type { Dish, DemoReview } from '../data/menu';

/**
 * Info-card set for the AR dish display, styled after the Crave Nation
 * promo layout: big bubble-letter title, small coloured fact cards around
 * the food, a tilted calories sign, a thought-bubble tagline and a
 * "Must try!" bear.
 */

/** Big playful purple title with dark outline (bubble-letter look). */
export function TitleBubble({ dish }: { dish: Dish }) {
  return (
    <div className="boardx title-bubble">
      <span>{dish.name}</span>
    </div>
  );
}

/** Blue card, top-left: serving size. */
export function ServesCard({ dish }: { dish: Dish }) {
  return (
    <div className="boardx card-serves">
      <span className="fact-big">{dish.serves}</span>
      <span className="fact-icons">👦👧</span>
      <span className="card-tag">sample</span>
    </div>
  );
}

/** Red card: no-palm-oil claim (sample until confirmed). */
export function NoPalmOilCard({ dish }: { dish: Dish }) {
  if (!dish.noPalmOil) return null;
  return (
    <div className="boardx card-nopalm">
      <span className="no-x">
        No <em className="no-icon">🚫</em>
      </span>
      <span className="no-label">
        palm <em className="fire">🔥</em>
        <br />
        oil
      </span>
      <span className="card-tag">sample</span>
    </div>
  );
}

/** Yellow card: one-line description. */
export function DescriptionCard({ dish }: { dish: Dish }) {
  return (
    <div className="boardx card-desc">
      {dish.shortDesc}
      <span className="card-tag card-tag-dark">sample</span>
    </div>
  );
}

/** Purple thought bubble with the tagline + demo star rating. */
export function TaglineBubble({ dish, review }: { dish: Dish; review?: DemoReview }) {
  return (
    <div className="boardx bubble-tagline">
      <span className="bubble-text">{dish.tagline}</span>
      {review && (
        <span className="bubble-review">
          “{review.text}” ★{review.stars}/5 — {review.name.replace('Demo ', '')} · demo
        </span>
      )}
    </div>
  );
}

/** Tilted red/blue "Calories 450" sign planted on a red stick. */
export function CalorieSign({ dish }: { dish: Dish }) {
  return (
    <div className="boardx calorie-sign">
      <div className="cal-sign-top">
        <svg className="cal-speedo" viewBox="0 0 24 24" width="1em" height="1em">
          <path d="M12 4a9 9 0 0 1 9 9 8.9 8.9 0 0 1-1.2 4.5H4.2A8.9 8.9 0 0 1 3 13a9 9 0 0 1 9-9z" fill="none" stroke="#fff" strokeWidth="2" />
          <path d="M12 13l4-4.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <circle cx="12" cy="13.5" r="1.6" fill="#fff" />
        </svg>
        <span className="cal-title">Calories</span>
      </div>
      <div className="cal-sign-body">
        <span className="cal-kcal">{dish.calories.kcal}</span>
        <span className="cal-macros">
          {dish.calories.carbs}grams Carbs
          <br />
          {dish.calories.fat}grams fat
        </span>
      </div>
      <div className="cal-stick" />
      <span className="card-tag card-tag-dark">estimate</span>
    </div>
  );
}

/** Small ingredients chip row (kept from the earlier prototype; sample data). */
export function IngredientsStrip({ dish }: { dish: Dish }) {
  return (
    <div className="boardx ingredients-strip">
      {dish.ingredients.slice(0, 3).map((ing) => (
        <span key={ing.label} className="ingredient-chip">
          <em>{ing.icon}</em> {ing.label.replace(' (sample)', '')}
        </span>
      ))}
      <span className="sample-note">sample ingredients</span>
    </div>
  );
}

/** "Must try!" script text above the bear mascot (positioned by Mascot). */
export function MustTry() {
  return <span className="must-try">Must try!</span>;
}

/** Cycles sample reviews while the AR experience is open. */
export function useReviewCycler(dish: Dish, active: boolean): { review: DemoReview; index: number } {
  const [state, setState] = useState<{ id: string; i: number }>({ id: dish.id, i: 0 });
  useEffect(() => {
    if (!active) return;
    const int = setInterval(() => {
      setState((s) => (s.id === dish.id ? { id: dish.id, i: s.i + 1 } : s));
    }, 5200);
    return () => clearInterval(int);
  }, [dish.id, active]);
  const index = (state.id === dish.id ? state.i : 0) % dish.reviews.length;
  return { review: dish.reviews[index], index };
}
