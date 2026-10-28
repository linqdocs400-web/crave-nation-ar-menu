import { useEffect, useMemo, useState } from 'react';
import type { Dish, DemoReview } from '../data/menu';

/** Animated stars with a "demo rating" label — never presented as real data. */
export function Stars({ value, demo = true }: { value: number; demo?: boolean }) {
  const stars = useMemo(() => {
    const full = Math.floor(value);
    const half = value - full >= 0.5;
    return Array.from({ length: 5 }, (_, i) => i < full ? 'full' : i === full && half ? 'half' : 'empty');
  }, [value]);
  return (
    <div className="stars" title={demo ? 'Demo rating — not a real customer rating' : undefined}>
      {stars.map((kind, i) => (
        <svg key={i} className={`star star-${kind}`} viewBox="0 0 24 24" style={{ animationDelay: `${i * 90}ms` }}>
          <defs>
            <linearGradient id={`half-${i}`}>
              <stop offset="50%" stopColor="#ffc531" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.25)" />
            </linearGradient>
          </defs>
          <path
            d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6z"
            fill={kind === 'full' ? '#ffc531' : kind === 'half' ? `url(#half-${i})` : 'rgba(255,255,255,0.25)'}
          />
        </svg>
      ))}
      {demo && <span className="stars-label">demo rating</span>}
    </div>
  );
}

/** Cream/orange speech bubble with a sample review, avatar and 5-star rating. */
export function ReviewBoard({ review, index }: { review: DemoReview; index: number }) {
  const initials = review.name.replace('Demo Customer', 'D').trim().slice(0, 2).toUpperCase();
  return (
    <div className="board board-review" style={{ animationDelay: `${150 + index * 200}ms` }}>
      <span className="board-sample-tag">sample review</span>
      <div className="review-head">
        <span className="review-avatar">{initials}</span>
        <div>
          <strong>{review.name}</strong>
          <Stars value={review.stars} demo={false} />
        </div>
      </div>
      <p>“{review.text}”</p>
      <span className="demo-note">Fictional prototype review — not a real customer comment.</span>
    </div>
  );
}

/** Bright blue calorie card; values are clearly marked estimates. */
export function CalorieBoard({ dish }: { dish: Dish }) {
  return (
    <div className="board board-calories" style={{ animationDelay: '280ms' }}>
      <span className="board-sample-tag">estimate</span>
      <span className="calorie-icon">🔥</span>
      <span className="calorie-value">~{dish.caloriesEstimate}</span>
      <span className="calorie-unit">kcal / serving</span>
      <span className="demo-note">Unverified sample estimate — not a nutrition claim.</span>
    </div>
  );
}

/** Small ingredient chip row (editable sample content). */
export function IngredientsBoard({ dish }: { dish: Dish }) {
  return (
    <div className="board board-ingredients" style={{ animationDelay: '420ms' }}>
      <span className="board-sample-tag">sample</span>
      <span className="ingredients-title">Ingredients</span>
      <div className="ingredients-chips">
        {dish.ingredients.slice(0, 3).map((ing) => (
          <span key={ing.label} className="ingredient-chip">
            <em>{ing.icon}</em> {ing.label}
          </span>
        ))}
      </div>
      <span className="demo-note">Sample content until confirmed by the restaurant.</span>
    </div>
  );
}

/** Cycles through the dish's sample reviews while the AR experience is open. */
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
