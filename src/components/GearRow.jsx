import { useRef } from "react";
import GearCard from "./GearCard.jsx";

export default function GearRow({ title, summary, items, search }) {
  const track = useRef(null);
  const scroll = (dir) =>
    track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <section className="row">
      <header className="row-info">
        <h2>{title}</h2>
        <p>{summary}</p>
      </header>
      <div className="row-body">
        <button className="arrow" onClick={() => scroll(-1)} aria-label={`Scroll ${title} left`}>‹</button>
        <div className="track" ref={track}>
          {items.map((it) => <GearCard key={it.id} item={it} search={search} />)}
        </div>
        <button className="arrow" onClick={() => scroll(1)} aria-label={`Scroll ${title} right`}>›</button>
      </div>
    </section>
  );
}
