import { contacts } from '../data/site';
import { Icon } from './Icon';

const handleOf = (url: string) => url.slice(url.lastIndexOf('/') + 1);

const entries = [
  { icon: 'mail', label: 'Email', href: `mailto:${contacts.email}`, text: contacts.email },
  { icon: 'github', label: 'GitHub', href: contacts.github, text: handleOf(contacts.github) },
  { icon: 'x', label: 'X', href: contacts.x, text: handleOf(contacts.x) },
  {
    icon: 'linkedin',
    label: 'LinkedIn',
    href: contacts.linkedin,
    text: handleOf(contacts.linkedin),
  },
] as const;

export const Contact = () => {
  return (
    <section id="contact" className="contact">
      <h2>Contact</h2>
      <dl>
        {entries.map((entry) => (
          <div key={entry.label}>
            <dt>
              <Icon name={entry.icon} />
              {entry.label}
            </dt>
            <dd>
              <a href={entry.href}>{entry.text}</a>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
