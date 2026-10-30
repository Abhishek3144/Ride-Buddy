import { Link } from "react-router-dom";

export default function GearCard({ item, search }) {
  // Support catalog array 'images' or legacy 'image'
  const displayImage = item.images?.[0] || item.image;
  
  // Format the catalog's raw numeric price
  const formattedPrice = typeof item.price === 'number'
    ? `₹${item.price.toLocaleString('en-IN')}`
    : item.price;

  // Safely handle materials array
  const materialsList = item.materials?.join(", ") || "";

  return (
    <Link to={`/gear/${item.type}/${item.id}${search}`} className="card">
      <div className="card-img">
        {displayImage ? <img src={displayImage} alt={item.name} /> : <span>{item.brand}</span>}
      </div>
      <div className="card-body">
        <h3>{item.name}</h3>
        {materialsList && <p>{materialsList}</p>}
        {formattedPrice && <p className="price" style={{ fontWeight: 'bold' }}>{formattedPrice}</p>}
      </div>
    </Link>
  );
}