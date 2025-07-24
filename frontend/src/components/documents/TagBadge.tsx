import React from 'react';

// Función para obtener un color consistente basado en el string del tag
const FNV1a = (str: string) => {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
};

const colors = [
  'bg-sky-100 text-sky-800', 'bg-amber-100 text-amber-800',
  'bg-violet-100 text-violet-800', 'bg-emerald-100 text-emerald-800',
  'bg-rose-100 text-rose-800', 'bg-fuchsia-100 text-fuchsia-800',
  'bg-indigo-100 text-indigo-800', 'bg-teal-100 text-teal-800',
];

const TagBadge: React.FC<{ tag: string }> = ({ tag }) => {
  const colorClass = colors[FNV1a(tag) % colors.length];
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colorClass}`}>
      {tag}
    </span>
  );
};

export default TagBadge;