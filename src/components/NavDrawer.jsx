import { Link, useSearchParams } from "react-router-dom";
import { GEAR_TYPES } from "../data/gearTypes.js";

export default function NavDrawer({ open, onClose }) {
  const [params] = useSearchParams();
  const style = params.get("style");
  const qs = style ? `?style=${style}` : "";

  return (
    <nav className={open ? "drawer open" : "drawer"} aria-hidden={!open} aria-label="Gear types">
      <button className="drawer-close" onClick={onClose} aria-label="Close gear menu" tabIndex={open ? 0 : -1}>Close</button>
      <Link to="/" onClick={onClose} className="drawer-link" tabIndex={open ? 0 : -1}>Home</Link>
      <ul>
        {GEAR_TYPES.map((g) => (
          <li key={g.slug}>
            {g.ready ? (
              <Link to={`/gear/${g.slug}${qs}`} onClick={onClose} className="drawer-link" tabIndex={open ? 0 : -1}>
                {g.label}
              </Link>
            ) : (
              <span className="drawer-link soon">{g.label}<small>Coming soon</small></span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
