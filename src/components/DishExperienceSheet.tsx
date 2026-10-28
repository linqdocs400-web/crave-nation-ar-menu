import type { Dish } from '../data/menu';
import {
  TitleBubble,
  ServesCard,
  NoPalmOilCard,
  DescriptionCard,
  TaglineBubble,
  CalorieSign,
  IngredientsStrip,
  useReviewCycler,
} from './Boards';
import { Mascot } from './Mascot';
import { IMAGE_PATHS } from '../data/menu';

/**
 * The dish info display, styled after the Crave Nation promo artwork:
 * bubble-letter title up top, sample fact cards around the food, tilted
 * calorie sign and a "Must try!" bear. In AR mode the food is rendered by
 * three.js anchored at `boardAnchor`; the HTML composition surrounds it.
 * In demo mode the food photo is drawn from the dish crop with CSS.
 */
export function DishExperienceSheet({
  dish,
  arActive,
  onClose,
  boardAnchor,
}: {
  dish: Dish;
  /** true when cards float over the live camera feed, false in demo mode */
  arActive: boolean;
  onClose: () => void;
  /** container-relative px position of the food, when in AR mode */
  boardAnchor?: { x: number; y: number } | null;
}) {
  const { review } = useReviewCycler(dish, true);

  // CSS crop of the dish photo (menu.jpg or the nuggets photo) for demo mode
  let foodStyle: React.CSSProperties | undefined;
  if (!arActive && dish.crop) {
    const url = dish.crop.image === 'nuggets' ? IMAGE_PATHS.nuggets : IMAGE_PATHS.menu;
    const { x, y, w, h } = dish.crop;
    foodStyle = {
      backgroundImage: `url(${url})`,
      backgroundSize: `${100 / w}% ${100 / h}%`,
      backgroundPosition: `${(x / (1 - w)) * 100}% ${(y / (1 - h)) * 100}%`,
    };
  }

  return (
    <div className={`dish-sheet ${arActive ? 'dish-sheet-ar' : 'dish-sheet-demo'}`} key={dish.id}>
      <button className="btn-close" onClick={onClose} aria-label="Close dish">
        ✕
      </button>

      <div
        className="boards-anchor"
        style={arActive && boardAnchor ? { left: boardAnchor.x, top: boardAnchor.y } : undefined}
        data-active={String(arActive)}
      >
        <div className="dishboard-comp" data-phase={arActive ? 'ar' : 'demo'}>
          <TitleBubble dish={dish} />
          {!arActive && (
            <div className="food-photo" style={foodStyle}>
              <span className="food-photo-shadow" />
            </div>
          )}
          <span className="price-chip">{dish.priceLabel}</span>
          <ServesCard dish={dish} />
          <NoPalmOilCard dish={dish} />
          <DescriptionCard dish={dish} />
          <TaglineBubble dish={dish} review={review} />
          <CalorieSign dish={dish} />
          <IngredientsStrip dish={dish} />
          <div className="mascot-holder">
            <Mascot celebrating={arActive} />
          </div>
        </div>
      </div>

      <span className="prototype-tag">
        Crave Nation · AR prototype — serves/description/palm-oil tags, calories & reviews are sample
        content; prices as printed on the supplied menu
      </span>
    </div>
  );
}
