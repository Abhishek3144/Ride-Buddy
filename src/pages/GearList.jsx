import { Link, useParams, useSearchParams } from "react-router-dom";
import { GEAR_DATA } from "../data/index.js";
import { CERT_MAPS, certLabel } from "../data/certifications.js";
import { RIDING_STYLES, GEAR_TYPES } from "../data/gearTypes.js";
import { groupByRating } from "../utils/groupByRating.js";
import GearRow from "../components/GearRow.jsx";

export default function GearList() {
  const { type } = useParams();
  const [params] = useSearchParams();
  const style = params.get("style");
  const search = style ? `?style=${style}` : "";

  const all = GEAR_DATA[type];
  const rankMap = CERT_MAPS[type];
  if (!all) return <p className="empty">No {type} yet. Pick another gear type from the menu.</p>;

  const plural = GEAR_TYPES.find((g) => g.slug === type)?.plural ?? type;
  const filtered = style ? all.filter((g) => g.ridingStyles.includes(style)) : all;
  const groups = groupByRating(filtered, rankMap);
  const styleLabel = RIDING_STYLES.find((s) => s.value === style)?.label;
  const heading = `${styleLabel ? `${styleLabel} ` : ""}${plural}`;

  return (
    <div className="list">
      <h1 className="page-title">{heading.charAt(0).toUpperCase() + heading.slice(1)}</h1>
      <p className="page-sub">Highest protection first. Ratings are certification classes, not brand scores.</p>
      {groups.length === 0 && (
        <p className="empty">No {plural} for this style yet. <Link to="/">Choose another style</Link>.</p>
      )}
      {groups.map(({ key, items }) => (
        <GearRow
          key={key}
          title={certLabel(items[0].certification)}
          summary={rankMap[key]?.summary}
          items={items}
          search={search}
        />
      ))}
    </div>
  );
}
