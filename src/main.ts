import './style.css';
import { mount } from './ui/app';

const root = document.querySelector<HTMLElement>('#app');
if (root) mount(root);
