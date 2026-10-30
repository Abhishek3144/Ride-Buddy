import { Link } from "react-router-dom";
import { RIDING_STYLES } from "../data/gearTypes.js";

export default function Home() {
  return (
    <div className="hero">
      <div className="hero-inner">
        <h1 className="brand">Riding Buddy</h1>
        <h2>Choose your riding style</h2>
        <div className="styles">
          {RIDING_STYLES.map((s) => (
            <Link key={s.value} to={`/choose?style=${s.value}`} className="style-btn">
              {s.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
