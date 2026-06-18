/** Totalizador de sequência: dias seguidos + maior sequência. */
export function StreakStats({ current, longest }: { current: number; longest: number }) {
  return (
    <div className="cal__stats">
      <div>
        <b>{current}</b>
        <span>dias seguidos</span>
      </div>
      <div>
        <b>{longest}</b>
        <span>maior sequência</span>
      </div>
    </div>
  );
}
