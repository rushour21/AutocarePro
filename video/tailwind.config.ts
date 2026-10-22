import path from 'node:path';
import base from '../tailwind.config';

const root = path.resolve(process.cwd(), '..');
export default {
  ...base,
  content: [path.join(process.cwd(), 'src/**/*.{ts,tsx}'), path.join(root, 'components/**/*.{ts,tsx}'), path.join(root, 'app/**/*.{ts,tsx}')],
};
