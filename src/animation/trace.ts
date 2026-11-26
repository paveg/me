import { animate, createScope } from 'animejs';

const PLAYHEAD_DELAY_MS = 300;
const PLAYHEAD_DURATION_MS = 2600;
const FADE_DURATION_MS = 300;
const TOGGLE_DURATION_MS = 420;
// JSが届く前に、完成した経歴がこれより長く見えていたら、消して描き直さない
const INTRO_SKIP_AFTER_PAINT_MS = 250;

const shownLongBeforeScript = () => {
  const firstPaint = performance.getEntriesByName('first-contentful-paint')[0];
  return (
    firstPaint !== undefined && performance.now() - firstPaint.startTime > INTRO_SKIP_AFTER_PAINT_MS
  );
};

interface Span {
  bar: HTMLElement;
  left: number;
  width: number;
  fades: HTMLElement[];
}

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

const readSpans = (root: HTMLElement): Span[] => {
  return [...root.querySelectorAll<HTMLElement>('details.trace-row')].flatMap((row) => {
    const bar = row.querySelector<HTMLElement>('.bar');
    if (!bar) return [];
    const fades = [...row.querySelectorAll<HTMLElement>('.duration, .open-end')];
    return [{ bar, left: parseFloat(bar.style.left), width: parseFloat(bar.style.width), fades }];
  });
};

const clearSpanStyles = (spans: Span[]) => {
  for (const { bar, fades } of spans) {
    bar.style.transform = '';
    for (const el of fades) {
      el.style.opacity = '';
      el.style.transition = '';
    }
  }
};

const clearToggleStyles = (body: HTMLElement) => {
  body.style.height = '';
  body.style.paddingTop = '';
  body.style.paddingBottom = '';
  body.style.opacity = '';
};

// border-boxなので高さだけを0にしても上下のpaddingが残る。paddingも一緒に動かして途中の段差をなくす
const animateToggle = (body: HTMLElement, opening: boolean, onComplete: () => void) => {
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
};

const bindToggleAnimation = (details: HTMLDetailsElement): (() => void) => {
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
};

export const startTraceAnimation = (root: HTMLElement): (() => void) => {
  const scope = createScope({
    root,
    mediaQueries: { reduceMotion: '(prefers-reduced-motion)' },
  });

  scope.add((self) => {
    if (self?.matches.reduceMotion || shownLongBeforeScript()) return;

    const spans = readSpans(root);
    const axis = root.querySelector<HTMLElement>('.ticks');
    const playhead = document.createElement('span');
    playhead.className = 'playhead';
    playhead.setAttribute('aria-hidden', 'true');
    root.append(playhead);

    const render = (cursor: number) => {
      if (axis) {
        const originX = axis.getBoundingClientRect().left - root.getBoundingClientRect().left;
        playhead.style.transform = `translateX(${originX + (cursor / 100) * axis.clientWidth}px)`;
      }
      for (const { bar, left, width, fades } of spans) {
        const progress = clamp01((cursor - left) / width);
        bar.style.transform = `scaleX(${progress})`;
        for (const el of fades) el.style.opacity = progress >= 1 ? '1' : '0';
      }
    };
    let fadeCleanupTimer: number | undefined;
    const finish = () => {
      window.clearTimeout(fadeCleanupTimer);
      clearSpanStyles(spans);
      playhead.remove();
    };
    const finishAfterFade = () => {
      for (const { bar, fades } of spans) {
        bar.style.transform = '';
        for (const el of fades) el.style.opacity = '1';
      }
      playhead.remove();
      fadeCleanupTimer = window.setTimeout(() => clearSpanStyles(spans), FADE_DURATION_MS);
    };

    if (axis) playhead.style.top = `${axis.offsetTop}px`;
    render(0);
    for (const { fades } of spans) {
      for (const el of fades) el.style.transition = `opacity ${FADE_DURATION_MS}ms`;
    }

    const state = { cursor: 0 };
    animate(state, {
      cursor: parseFloat(root.style.getPropertyValue('--now')),
      duration: PLAYHEAD_DURATION_MS,
      delay: PLAYHEAD_DELAY_MS,
      ease: 'inOutSine',
      onUpdate: () => render(state.cursor),
      onComplete: finishAfterFade,
    });

    const unbinds = [...root.querySelectorAll<HTMLDetailsElement>('details.trace-row')].map(
      bindToggleAnimation,
    );
    return () => {
      finish();
      unbinds.forEach((unbind) => unbind());
    };
  });

  return () => scope.revert();
};
