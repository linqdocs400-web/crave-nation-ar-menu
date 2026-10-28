import type { Dish } from '../data/menu';
import { ReviewBoard, CalorieBoard, IngredientsBoard, Stars, useReviewCycler } from './Boards';
import { Mascot } from './Mascot';

/**
 * The full dish experience sheet: name+price bar, floating boards, mascot and
 * the AR camera content behind it (when arActive) — shared between the
 * camera AR flow and the non-AR demo mode.
 */
export function DishExperienceSheet({
  dish,
  arActive,
  onClose,
  boardAnchor,
  mascotLine,
}: {
  dish: Dish;
  /** true when boards float over the live camera feed, false in demo mode */
  arActive: boolean;
  onClose: () => void;
  /** container-relative px position of the food, when in AR mode */
  boardAnchor?: { x: number; y: number } | null;
  mascotLine?: string;
}) {
  const { review, index } = useReviewCycler(dish, true);
  const style = arActive && boardAnchor
    ? {
        left: boardAnchor.x,
        top: boardAnchor.y,
      }
    : undefined;

  return (
    <div className={`dish-sheet ${arActive ? 'dish-sheet-ar' : 'dish-sheet-demo'}`} key={dish.id}>
      <div className="dish-topbar">
        <div className="dish-titlebox">
          <span className="dish-name">{dish.name}</span>
          <span className="dish-price">{dish.priceLabel}</span>
        </div>
        <button className="btn-close" onClick={onClose} aria-label="Close dish">
          ✕ Close
        </button>
      </div>

      <div className="boards-anchor" style={style} data-active={String(arActive)}>
        <ReviewBoard review={review} index={index} />
        <CalorieBoard dish={dish} />
        <IngredientsBoard dish={dish} />
        <div className="board board-rating" style={{ animationDelay: '560ms' }}>
          <span className="board-sample-tag">demo</span>
          <Stars value={dish.demoRating} demo />
        </div>
      </div>

      <Mascot line={mascotLine ?? dish.mascotLine} celebrating={arActive} />
      <span className="prototype-tag">Crave Nation · AR prototype · all reviews, ratings &amp; nutrition are sample content</span>
    </div>
  );
}
