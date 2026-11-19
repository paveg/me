import { animate, createScope, stagger } from 'animejs';

const BAR_START_DELAY_MS = 300;
const BAR_STAGGER_MS = 140;
const TOGGLE_DURATION_MS = 420;

function sortByStart(bars: HTMLElement[]): HTMLElement[] {
  return [...bars].sort((a, b) => parseFloat(a.style.left) - parseFloat(b.style.left));
}

function clearToggleStyles(body: HTMLElement) {
  body.style.height = '';
  body.style.paddingTop = '';
  body.style.paddingBottom = '';
  body.style.opacity = '';
}

// border-boxなので高さだけを0にしても上下のpaddingが残る。paddingも一緒に動かして途中の段差をなくす
function animateToggle(body: HTMLElement, opening: boolean, onComplete: () => void) {
  const { paddingTop, paddingBottom } = getComputedStyle(body);
  const shown = { height: body.offsetHeight, paddingTop, paddingBottom, opacity: 1 };
  const hidden = { height: 0, paddingTop: 0, paddingBottom: 0, opacity: 0 };
  const [from, to] = opening ? [hidden, shown] : [shown, hidden];
  animate(body, {
    height: [from.height, to.height],
    paddingTop: [from.paddingTop, to.paddingTop],
    paddingBottom: [from.paddingBottom, to.paddingBottom],
    opacity: [from.opacity, to.opacity],
    duration: TOGGLE_DURATION_MS,
    ease: 'outCubic',
    onComplete: () => {
      clearToggleStyles(body);
      onComplete();
    },
  });
}

function bindToggleAnimation(details: HTMLDetailsElement): () => void {
  const summary = details.querySelector('summary');
  const body = details.querySelector<HTMLElement>('.detail');
  if (!summary || !body) return () => {};

  let isAnimating = false;
  const onClick = (event: Event) => {
    event.preventDefault();
    if (isAnimating) return;
    isAnimating = true;
    const finish = () => {
      isAnimating = false;
    };
    if (details.open) {
      animateToggle(body, false, () => {
        details.open = false;
        finish();
      });
    } else {
      details.open = true;
      animateToggle(body, true, finish);
    }
  };
  summary.addEventListener('click', onClick);
  return () => {
    summary.removeEventListener('click', onClick);
    clearToggleStyles(body);
  };
}

export function startTraceAnimation(root: HTMLElement): () => void {
  const scope = createScope({
    root,
    mediaQueries: { reduceMotion: '(prefers-reduced-motion)' },
  });

  scope.add((self) => {
    if (self?.matches.reduceMotion) return;

    const bars = sortByStart([...root.querySelectorAll<HTMLElement>('.bar')]);
    animate(root.querySelectorAll('.tick'), {
      scaleY: [0, 1],
      opacity: [0, 1],
      duration: 500,
      delay: stagger(60),
      ease: 'outQuad',
    });
    animate(bars, {
      scaleX: [0, 1],
      duration: 900,
      delay: stagger(BAR_STAGGER_MS, { start: BAR_START_DELAY_MS }),
      ease: 'outExpo',
    });
    animate(root.querySelectorAll('.open-end'), {
      opacity: [0, 1],
      scale: [0.2, 1.6, 1],
      duration: 900,
      delay: BAR_START_DELAY_MS + BAR_STAGGER_MS * bars.length,
      ease: 'outElastic(1, .6)',
    });

    const unbinds = [...root.querySelectorAll<HTMLDetailsElement>('details.trace-row')].map(
      bindToggleAnimation,
    );
    return () => unbinds.forEach((unbind) => unbind());
  });

  return () => scope.revert();
}
