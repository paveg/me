export type IconName = 'github' | 'x' | 'linkedin' | 'mail' | 'caret';

export const Icon = ({ name, className = 'icon' }: { name: IconName; className?: string }) => {
  return (
    <svg className={className} aria-hidden="true">
      <use href={`#i-${name}`} />
    </svg>
  );
};
