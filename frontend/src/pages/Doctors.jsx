import { useEffect, useState } from "react";
import "../App.css";

// ✅ CORS proxy fixes the blocked request from localhost
const OVERPASS_URL = "https://corsproxy.io/?https://overpass-api.de/api/interpreter";

export default function Doctors() {
  const [doctors, setDoctors]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [cityInput, setCityInput]       = useState("");

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchDoctors(pos.coords.latitude, pos.coords.longitude),
      () => {
        setLocationDenied(true);
        setLoading(false);
      }
    );
  }, []);

  const fetchDoctors = async (lat, lng) => {
    setLoading(true);
    setError(null);
    setLocationDenied(false);

    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="doctors"](around:5000,${lat},${lng});
        node["amenity"="clinic"](around:5000,${lat},${lng});
        node["amenity"="hospital"](around:5000,${lat},${lng});
        way["amenity"="hospital"](around:5000,${lat},${lng});
      );
      out body center 12;
    `;

    try {
      const formData = new URLSearchParams();
      formData.append("data", query);

      const res = await fetch(OVERPASS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      if (!res.ok) throw new Error(`Request failed: ${res.status}`);

      const data = await res.json();

      const formatted = (data.elements || [])
        .filter((el) => el.tags?.name)
        .slice(0, 10)
        .map((el) => ({
          name:    el.tags.name,
          type:    el.tags["healthcare:speciality"] || el.tags.amenity || "Healthcare",
          address: [el.tags["addr:street"], el.tags["addr:city"]]
                     .filter(Boolean).join(", ") || "Nearby",
          phone:   el.tags.phone || el.tags["contact:phone"] || null,
          website: el.tags.website || null,
          lat:     el.lat ?? el.center?.lat,
          lng:     el.lon ?? el.center?.lon,
        }));

      setDoctors(formatted);
    } catch (err) {
      console.error(err);
      setError("Could not load doctors. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleCitySearch = async () => {
    if (!cityInput.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityInput)}&format=json&limit=1`
      );
      const data = await res.json();

      if (data[0]) {
        fetchDoctors(parseFloat(data[0].lat), parseFloat(data[0].lon));
      } else {
        setError("City not found. Try a different name.");
        setLoading(false);
      }
    } catch (err) {
      setError("Failed to search city. Check your connection.");
      setLoading(false);
    }
  };

  const openMaps = (doc) =>
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${doc.lat},${doc.lng}`,
      "_blank"
    );

  return (
    <div className="dashboard">
      <h2>Top Doctors Near You</h2>

      {/* Location denied */}
      {locationDenied && (
        <div style={{
          background: "#1e2a3a",
          border: "1px solid var(--brand-blue)",
          borderRadius: "10px",
          padding: "16px",
          marginBottom: "16px",
          textAlign: "center",
        }}>
          <p>📍 Location access was denied.</p>
          <p style={{ fontSize: "13px", color: "#aaa" }}>
            Enable location in browser settings, or enter your city below.
          </p>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "10px" }}>
            <input
              placeholder="Enter city (e.g. Mumbai, Delhi...)"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCitySearch()}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #444",
                background: "#0d1b2a",
                color: "#fff",
                width: "220px",
              }}
            />
            <button
              onClick={handleCitySearch}
              style={{
                background: "var(--brand-blue)",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "8px 16px",
                cursor: "pointer",
              }}
            >
              Search
            </button>
          </div>
        </div>
      )}

      {loading  && <p>📡 Locating doctors near you…</p>}
      {error    && <p style={{ color: "#ff6b6b" }}>{error}</p>}
      {!loading && !error && !locationDenied && doctors.length === 0 && (
        <p>No doctors found nearby.</p>
      )}

      <div className="stats doctor-list">
        {doctors.map((doc, index) => (
          <div key={index} className="doctor-item">
            <h3>{doc.name}</h3>
            <p>🩺 {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}</p>
            <p>📍 {doc.address}</p>

            {doc.phone && (
              <p>
                📞{" "}
                <a href={`tel:${doc.phone}`} style={{ color: "var(--brand-blue)" }}>
                  {doc.phone}
                </a>
              </p>
            )}

            <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
              <button
                onClick={() => openMaps(doc)}
                style={{
                  background: "var(--brand-blue)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 14px",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                📌 Open in Maps
              </button>

             {/* ❌ BROKEN - missing ( after && */}


{/* ✅ FIXED - add ( ) around the JSX */}

            </div>

            {index !== doctors.length - 1 && <div className="doctor-divider" />}
          </div>
        ))}
      </div>
    </div>
  );
}