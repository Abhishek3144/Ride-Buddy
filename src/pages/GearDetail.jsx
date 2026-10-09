import { Link, useParams, useSearchParams } from "react-router-dom";
import { GEAR_DATA } from "../data/index.js";
import { CERT_MAPS, certKey, certLabel } from "../data/certifications.js";
import { RIDING_STYLES } from "../data/gearTypes.js";

export default function GearDetail() {
  const { type, id } = useParams();
  const [params] = useSearchParams();
  const search = params.get("style") ? `?style=${params.get("style")}` : "";

  const item = GEAR_DATA[type]?.find((g) => g.id === id);
  if (!item) return <p className="empty">That item doesn't exist. <Link to={`/gear/${type}`}>Back to the list</Link>.</p>;

  const summary = CERT_MAPS[type]?.[certKey(item.certification)]?.summary;
  const styles = item.ridingStyles.map((v) => RIDING_STYLES.find((s) => s.value === v)?.label ?? v);
  const slots = item.images.length ? item.images : [null, null, null, null];

  return (
    <article className="detail">
      <Link to={`/gear/${type}${search}`} className="back">Back to {type}</Link>
      <h1 className="page-title">{item.name}</h1>
      <p className="page-sub">{item.brand}</p>

      <div className="strip">
        {slots.map((src, i) => (
          <div className="strip-img" key={i}>
            {src ? <img src={src} alt={`${item.name} view ${i + 1}`} /> : <span>Photo {i + 1}</span>}
          </div>
        ))}
      </div>

      <section className="panel">
        <h2>{certLabel(item.certification)}</h2>
        <p>{summary}</p>
        <dl>
          {item.variant && (<><dt>Style</dt><dd>{item.variant}</dd></>)}
          <dt>Materials</dt><dd>{item.materials.join(", ")}</dd>
          <dt>Suited to</dt><dd>{styles.join(", ")}</dd>
          {item.otherCertifications?.length > 0 && (
            <><dt>Also certified</dt><dd>{item.otherCertifications.join(", ")}</dd></>
          )}
        </dl>
      </section>

      {/* Placeholder: real purchase sources come in a later phase. */}
      <section className="panel sources">
        <h2>Where to buy</h2>
        <p>Purchase sources will appear here.</p>
      </section>
    </article>
  );
}
