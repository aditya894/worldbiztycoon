export default function AdBanner() {
  const pubId = import.meta.env.VITE_ADSENSE_PUB_ID;
  if (!pubId || pubId.includes("XXXX")) return null;
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      display: "flex", justifyContent: "center", alignItems: "center",
      background: "#0a0015cc", borderTop: "1px solid #FFD70022",
      padding: "4px 0", zIndex: 100,
    }}>
      <ins
        className="adsbygoogle"
        style={{ display: "inline-block", width: "320px", height: "50px" }}
        data-ad-client={pubId}
        data-ad-slot="XXXXXXXXXX"
      />
    </div>
  );
}
