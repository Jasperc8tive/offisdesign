import type { Config } from 'tailwindcss';
import preset from '@offisdesign/config/tailwind-preset';

const config: Config = {
  presets: [preset as Partial<Config>],
  content: ['./src/**/*.{ts,tsx,mdx}', './.storybook/**/*.{ts,tsx}'],
};

export default config;
