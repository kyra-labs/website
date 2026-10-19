import { LoadingIndicator } from '@kyralabs/m3e-react';
import type { M3eSnackbarHost } from '@kyralabs/m3e-elements/snackbar-host.js';
import { type SubmitEvent, useRef, useState } from 'react';

type State = 'idle' | 'error' | 'loading' | 'success';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IDLE_STATUS = 'We’ll only write when something ships.';
const ERROR_STATUS = 'Enter a valid email address.';
const SUCCESS_STATUS = 'You’re on the list. We’ll write when something ships.';

/** The --m3e-sys-motion-duration-long1 token in ms: how long the simulated request takes. */
function requestDuration(): number {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--m3e-sys-motion-duration-long1')
    .trim();
  const value = Number.parseFloat(raw);
  return raw.endsWith('ms') ? value : value * 1000;
}

/**
 * The <m3e-snackbar-host> for the result, loaded on the first submit so the page pays nothing
 * for it up front. Appended to <body>: the card's reveal transform would contain a fixed host.
 */
async function snackbarHost(): Promise<M3eSnackbarHost> {
  await import('@kyralabs/m3e-elements/snackbar-host.js');
  let host = document.querySelector<M3eSnackbarHost>('m3e-snackbar-host.site-snackbars');
  if (!host) {
    host = document.createElement('m3e-snackbar-host') as M3eSnackbarHost;
    host.className = 'site-snackbars';
    document.body.append(host);
  }
  return host;
}

/**
 * Waitlist form island (client:only): an m3e outlined text field (the m3e-css markup, whose
 * label float, notch and colours are CSS only) with supporting and error text, the M3
 * LoadingIndicator while "Adding…" and a snackbar with the result.
 *
 * Behavior ported from the old assets/js/app.js unchanged, including that nothing is sent
 * anywhere yet: there is no waitlist backend. Wire a real endpoint into onSubmit to make it real.
 */
export default function WaitlistForm() {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>('idle');
  const [label, setLabel] = useState('Notify me');

  const onSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = input.current?.value.trim() ?? '';
    if (!EMAIL.test(email)) {
      setState('error');
      input.current?.focus();
      return;
    }
    setState('loading');
    setLabel('Adding…');
    const host = snackbarHost();
    window.setTimeout(() => {
      setState('success');
      setLabel('Added');
      form.reset();
      // If the snackbar chunk can't load (offline, a stale tab after a deploy), "Added" remains.
      host.then((h) => h.showSnackbar(SUCCESS_STATUS)).catch(() => undefined);
    }, requestDuration());
  };

  const onInput = () => {
    if (state === 'error' || state === 'success') setState('idle');
    if (label === 'Added') setLabel('Notify me');
  };

  const isLoading = state === 'loading';
  const isError = state === 'error';
  return (
    <form className="waitlist-form" data-state={state} noValidate onSubmit={onSubmit}>
      <div className="input-row">
        <div className="m3e-text-field m3e-text-field--outlined waitlist-field">
          <div className="m3e-text-field__container">
            <label className="m3e-text-field__label" htmlFor="home-email">
              Email address
            </label>
            <input
              ref={input}
              className="m3e-text-field__input"
              id="home-email"
              name="email"
              type="email"
              inputMode="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              aria-describedby="home-email-supporting"
              aria-invalid={isError ? true : undefined}
              onInput={onInput}
            />
            <fieldset className="m3e-text-field__outline" aria-hidden="true">
              <legend className="m3e-text-field__notch">
                <span>Email address</span>
              </legend>
            </fieldset>
          </div>
          <div className="m3e-text-field__supporting">
            {/* A new node when the error appears, so the alert is announced (as <TextField>). */}
            <span
              key={isError ? 'error' : 'idle'}
              className="m3e-text-field__supporting-text"
              id="home-email-supporting"
              role={isError ? 'alert' : undefined}
            >
              {isError ? ERROR_STATUS : IDLE_STATUS}
            </span>
          </div>
        </div>
        <button
          className="m3e-button m3e-button--size-m"
          type="submit"
          disabled={isLoading}
          aria-busy={isLoading ? true : undefined}
        >
          {isLoading ? (
            <span className="waitlist-form__indicator" aria-hidden="true">
              <LoadingIndicator aria-label="Adding" />
            </span>
          ) : null}
          {label}
        </button>
      </div>
    </form>
  );
}
