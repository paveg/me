import './styles.css';
import { startTraceAnimation } from './animation/trace';

const trace = document.querySelector<HTMLElement>('.trace');
if (trace) startTraceAnimation(trace);
