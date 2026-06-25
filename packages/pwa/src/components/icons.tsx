/** Ícones da UI (react-icons / Lucide, traço, herdam currentColor). */

import { GiFruitTree } from 'react-icons/gi';
import { LuPencil, LuSearch, LuSettings } from 'react-icons/lu';

export function GardenIcon() {
  return <GiFruitTree size={22} aria-hidden />;
}

export function PencilIcon() {
  return <LuPencil size={24} aria-hidden />;
}

export function SearchIcon() {
  return <LuSearch aria-hidden />;
}

export function SettingsIcon() {
  return <LuSettings size={22} aria-hidden />;
}
