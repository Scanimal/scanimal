import { browser } from '$app/environment';

const SCHEME_KEY = 'scanimal-theme';
const ACCENT_KEY = 'scanimal-accent';

export type Scheme = 'light' | 'dark';

/**
 * WebAwesome ships these as `.wa-brand-*` classes on the root element, so
 * swapping the accent is a class swap — every brand token, and therefore every
 * button gradient, follows automatically.
 */
export const ACCENTS = [
	{ id: 'purple', label: 'Purple' },
	{ id: 'indigo', label: 'Indigo' },
	{ id: 'blue', label: 'Blue' },
	{ id: 'cyan', label: 'Cyan' },
	{ id: 'green', label: 'Green' },
	{ id: 'yellow', label: 'Yellow' },
	{ id: 'orange', label: 'Orange' },
	{ id: 'red', label: 'Red' },
	{ id: 'pink', label: 'Pink' },
	{ id: 'gray', label: 'Gray' }
] as const;

export type Accent = (typeof ACCENTS)[number]['id'];

export const DEFAULT_ACCENT: Accent = 'purple';

const isAccent = (v: string | null): v is Accent => !!v && ACCENTS.some((a) => a.id === v);

// The inline script in app.html resolves both before first paint; read back off
// <html> so the SSR markup and the client agree on the first render.
const initialScheme = (): Scheme =>
	browser && document.documentElement.classList.contains('wa-dark') ? 'dark' : 'light';

const initialAccent = (): Accent => {
	if (!browser) return DEFAULT_ACCENT;
	const found = ACCENTS.find((a) =>
		document.documentElement.classList.contains(`wa-brand-${a.id}`)
	);
	return found ? found.id : DEFAULT_ACCENT;
};

let scheme = $state<Scheme>(initialScheme());
let accent = $state<Accent>(initialAccent());

export const theme = {
	get current(): Scheme {
		return scheme;
	},
	get isDark(): boolean {
		return scheme === 'dark';
	},
	get accent(): Accent {
		return accent;
	},

	setScheme(next: Scheme): void {
		scheme = next;
		const root = document.documentElement;
		root.classList.toggle('wa-dark', next === 'dark');
		root.classList.toggle('wa-light', next === 'light');
		localStorage.setItem(SCHEME_KEY, next);
	},

	toggle(): void {
		this.setScheme(scheme === 'dark' ? 'light' : 'dark');
	},

	setAccent(next: Accent): void {
		if (!isAccent(next)) return;
		const root = document.documentElement;
		for (const a of ACCENTS) root.classList.remove(`wa-brand-${a.id}`);
		root.classList.add(`wa-brand-${next}`);
		accent = next;
		localStorage.setItem(ACCENT_KEY, next);
	}
};
