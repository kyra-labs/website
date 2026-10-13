import { ShortNavigationBar } from '@kyralabs/m3e-react';
import { useEffect, useState } from 'react';
import type { NavLink } from '../nav';

interface Props {
  items: readonly NavLink[];
}

// M3 window size classes: compact < 600dp ≤ medium. The bar is hidden from expanded (840dp) up,
// where the top app bar shows the same links (site.css).
const MEDIUM = '(width >= 600px)';

/**
 * Navigation bar island (client:only). Vertical items on compact windows, horizontal on medium.
 * On the home page the destination whose section sits under the top third of the viewport is
 * selected (scroll spy); elsewhere nothing is.
 */
export default function SectionNav({ items }: Props) {
  const [isMedium, setIsMedium] = useState(() => window.matchMedia(MEDIUM).matches);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const query = window.matchMedia(MEDIUM);
    const onChange = () => setIsMedium(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const sections = items
      .filter((item) => item.href.startsWith('#'))
      .map((item) => ({ key: item.key, el: document.getElementById(item.key) }))
      .filter((s): s is { key: string; el: HTMLElement } => s.el !== null);
    if (sections.length === 0) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight / 3;
      let current: string | null = null;
      for (const { key, el } of sections) {
        if (el.getBoundingClientRect().top <= line) current = key;
      }
      // At the bottom of the page the last section may never reach the line.
      const atEnd =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1;
      setSelected(atEnd ? sections[sections.length - 1]!.key : current);
    };
    const onScroll = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, [items]);

  return (
    <ShortNavigationBar
      className="site-nav-bar"
      aria-label="Primary"
      layout={isMedium ? 'horizontal' : 'vertical'}
      items={items.map(({ key, label, icon, href }) => ({ key, label, icon, href }))}
      selectedKey={selected}
      onSelectionChange={setSelected}
    />
  );
}
