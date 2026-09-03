// @ts-check
import { defineConfig } from 'astro/config';

// For GitHub project pages the site lives at https://<user>.github.io/<repo>/.
// Override with SITE_BASE=/ for custom domains or user pages.
const base = process.env.SITE_BASE ?? '/doodle-icons';

export default defineConfig({
  base,
  output: 'static',
});
