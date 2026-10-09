import { Link } from "react-router-dom";

export default function GearCard({ item, search }) {
  return (
    <Link to={`/gear/${item.type}/${item.id}${search}`} className="card">
      <div className="card-img">
        {item.images[0] ? <img src={item.images[0]} alt={item.name} /> : <span>{item.brand}</span>}
      </div>
      <div className="card-body">
        <h3>{item.name}</h3>
        <p>{item.materials.join(", ")}</p>
      </div>
    </Link>
  );
}
