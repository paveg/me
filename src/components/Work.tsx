import type { Locale } from '../entry-server';
import type { Project } from '../data/types';
import { joinLines } from '../lib/text';

export function Work({ projects, locale }: { projects: Project[]; locale: Locale }) {
  return (
    <section id="work">
      <h2>Work</h2>
      <ul className="work">
        {projects.map((project) => (
          <li key={project.name}>
            <a href={project.url ?? project.repository}>{project.name}</a>
            <p>{joinLines(project.description, locale)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
