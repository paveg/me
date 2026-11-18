import type { SiteCopy } from '../data/site';

export function Offers({ copy }: { copy: SiteCopy }) {
  return (
    <section id="offers">
      <h2>{copy.ui.offersHeading}</h2>
      <ul className="offer">
        {copy.offers.map((offer) => (
          <li key={offer.title}>
            <h3>{offer.title}</h3>
            <p>{offer.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
