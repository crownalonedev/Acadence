import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';

export function mount(node: ReactNode) {
  document.documentElement.classList.add('js');
  createRoot(document.getElementById('root')!).render(<StrictMode>{node}</StrictMode>);
}
