import { useEffect, useRef } from "react";
import { m } from "../theme";
import { startScene } from "./flowScene";

/**
 * Decorative flow-field story under the hero: despair, a wizard hat drops,
 * a schedule appears, everyone cheers. All drawing happens in the canvas;
 * it carries no copy, so it is hidden from assistive tech.
 */
export default function FlowFieldStory() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const scene = startScene(canvas, { seed: (Math.random() * 2 ** 32) >>> 0, still });
    if (!scene) return;
    if (still) return scene.stop;

    let visible = false;
    const sync = () => scene.setRunning(visible && !document.hidden);
    const io =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([e]) => {
            visible = e.isIntersecting;
            sync();
          });
    if (io) io.observe(canvas);
    else {
      visible = true;
      sync();
    }
    document.addEventListener("visibilitychange", sync);
    return () => {
      io?.disconnect();
      document.removeEventListener("visibilitychange", sync);
      scene.stop();
    };
  }, []);

  return (
    <section aria-hidden="true" className="max-w-[92rem] mx-auto px-6 pb-20">
      <div className={`${m.surface} border ${m.rule.heavy}`}>
        <canvas ref={ref} className="block w-full h-auto aspect-[15/8]" />
      </div>
    </section>
  );
}
