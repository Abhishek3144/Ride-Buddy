import { Link, useSearchParams } from "react-router-dom";
import { GEAR_TYPES, RIDING_STYLES } from "../data/gearTypes.js";

export default function ChooseGear() {
  const [params] = useSearchParams();
  const style = params.get("style");
  const search = style ? `?style=${style}` : "";
  const styleLabel = RIDING_STYLES.find((s) => s.value === style)?.label;

  return (
    <div className="choose">
      <h1 className="page-title">What are you looking for?</h1>
      <p className="page-sub">
        {styleLabel ? <>Riding style: {styleLabel}. <Link to="/">Change</Link></> : "Pick a gear type."}
      </p>

      <div className="gear-grid">
        {GEAR_TYPES.map((g) => {
          // Put a photo at public/gear/<slug>.jpg and set `image` in gearTypes.js to use it.
          const bg = g.image ? { backgroundImage: `url(${g.image})` } : undefined;
          const inner = (
            <>
              <span className="gear-name">{g.label}</span>
              {!g.ready && <small>Coming soon</small>}
            </>
          );
          return g.ready ? (
            <Link key={g.slug} to={`/gear/${g.slug}${search}`} className="gear-tile" style={bg}>{inner}</Link>
          ) : (
            <div key={g.slug} className="gear-tile soon" style={bg} aria-disabled="true">{inner}</div>
          );
        })}
      </div>
    </div>
  );
}
