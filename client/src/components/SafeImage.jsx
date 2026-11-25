import { useState } from 'react';
import { Landmark } from 'lucide-react';

export default function SafeImage({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-amber-950/40 text-amber-400/70 ${className}`}
      >
        <Landmark className="h-10 w-10 mb-1.5" />
        <span className="text-xs font-medium tracking-wide uppercase text-slate-400">{alt || 'Rajasthan'}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
