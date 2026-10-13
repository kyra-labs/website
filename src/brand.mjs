// The one place the brand colour lives. scripts/gen-theme.mjs turns it into the M3 colour scheme
// (equivalent CLI: m3e-theme --seed "#d84848" --variant fidelity). Fidelity keeps
// primary-container on Kyra red; tonalSpot and expressive mute it.
/** @type {{ seed: string; variant: import('@kyralabs/m3e-tokens/theme').Variant }} */
export const brand = { seed: '#d84848', variant: 'fidelity' };
