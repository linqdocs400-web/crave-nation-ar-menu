import { useEffect, useState } from 'react';
import type { Dish, DemoReview } from '../data/menu';

/**
 * Info-card set for the AR dish display, styled after premium AR-menu
 * demos (KIVICUBE-like): retro script title, red "cloud" review bubble
 * with avatar, marquee-style calorie sign, ingredient stamps and a row
 * of gold stars.
 */

const RETRO_PALETTE = {
  red: '#e8442e',
  blue: '#1e4fa1',
  gold: '#f6b93d',
  navy: '#1d3a6e',
};

/** Retro script title with navy outline (like a diner sign). */
export function TitleBubble({ dish }: { dish: Dish }) {
  return (
    <div className="boardx title-bubble">
      <span>{dish.name}</span>
    </div>
  );
}

/** Red cloud-shaped review bubble with avatar + big quote marks. */
export function ReviewCloud({ review }: { review: DemoReview }) {
  return (
    <div className="boardx review-cloud">
      <span className="cloud-avatar" aria-hidden="true">
        {review.name.replace('Demo ', '').slice(0, 1)}
      </span>
      <span className="cloud-quote cloud-quote-open">“</span>
      <p className="cloud-text">{review.text}</p>
      <span className="cloud-quote cloud-quote-close">”</span>
      <span className="cloud-meta">★ {review.stars}/5</span>
    </div>
  );
}

/** Torn-stamp ingredient stickers. */
export function IngredientStamps({ dish }: { dish: Dish }) {
  return (
    <div className="boardx ingredient-stamps">
      {dish.ingredients.slice(0, 3).map((ing, i) => (
        <span key={ing.label} className="stamp" data-tilt={i % 2}>
          <span className="stamp-label">{ing.label.replace(' (sample)', '')}</span>
          <span className="stamp-icon">{ing.icon}</span>
        </span>
      ))}
    </div>
  );
}

/** Marquee-style calorie sign: gold script on red dome, big gold number. */
export function CalorieSign({ dish }: { dish: Dish }) {
  return (
    <div className="boardx calorie-sign">
      <div className="cal-dome">
        <svg className="cal-gauge" viewBox="0 0 60 34">
          <path d="M6 30a24 24 0 0 1 48 0" fill="none" stroke={RETRO_PALETTE.gold} strokeWidth="5" strokeLinecap="round" />
          <path d="M30 27 42 15" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" />
          <circle cx="30" cy="28" r="3.2" fill="#fff" />
        </svg>
        <span className="cal-title">Calories</span>
      </div>
      <div className="cal-body">
        <span className="cal-kcal">{dish.calories.kcal}</span>
        <span className="cal-macros">
          <span>{dish.calories.carbs}g carbs</span>
          <span>{dish.calories.fat}g fat</span>
        </span>
      </div>
      <div className="cal-stick" />
    </div>
  );
}

/** Row of gold stars (average of the dish's sample reviews). */
export function StarsRow({ dish }: { dish: Dish }) {
  const avg = dish.reviews.reduce((s, r) => s + r.stars, 0) / dish.reviews.length;
  const full = Math.round(avg);
  return (
    <div className="boardx stars-row" aria-label={`${avg.toFixed(1)} out of 5`}>
      {Array.from({ length: full }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" className="star">
          <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6z" fill={RETRO_PALETTE.gold} stroke={RETRO_PALETTE.navy} strokeWidth="1.2" />
        </svg>
      ))}
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
