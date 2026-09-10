"use client";

import { useEffect, useState } from "react";

export function Starfield() {
  const [shadows, setShadows] = useState("");

  useEffect(() => {
    // Generate starfield sekali di mount. Set dari useEffect kosong adalah
    // pola yang benar untuk inisialisasi yang butuh API browser (Math.random
    // aman di server, tapi dipanggil di client untuk animasi yang halus).
    const stars: string[] = [];
    for (let i = 0; i < 140; i++) {
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const size = Math.random() > 0.85 ? 2 : 1;
      const alpha = 0.25 + Math.random() * 0.7;
      stars.push(
        `${x.toFixed(2)}vw ${y.toFixed(2)}vh 0 ${size}px rgba(255,255,255,${alpha.toFixed(2)})`,
      );
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShadows(stars.join(", "));
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{ boxShadow: shadows }}
    />
  );
}
