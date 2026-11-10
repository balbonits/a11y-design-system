import { addons } from '@storybook/manager-api';

// Mobile-first: from 600px (where Storybook's own mobile nav stops) up to 1024px,
// start with the sidebar collapsed so the docs get the full width. The toolbar's
// "Show sidebar" button brings it back.
const w = window.innerWidth;
if (w >= 600 && w < 1024) addons.setConfig({ navSize: 0 });
