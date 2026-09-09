import { useEffect } from "react";

export default function AdBanner() {
  const pubId = import.meta.env.VITE_ADSENSE_PUB_ID;
  if (!pubId || pubId.includes("XXXX")) return null;

  useEffect(() => {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (_) {}
  }, []);

  return (
    <div style={{ width: "100%", background: "#f9fafb", textAlign: "center", padding: "2px 0" }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={pubId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
