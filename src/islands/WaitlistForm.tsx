import { LoadingIndicator } from '@kyralabs/m3e-react';
import { type SubmitEvent, useRef, useState } from 'react';

type State = 'idle' | 'error' | 'loading' | 'success';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IDLE_STATUS = 'We’ll only write when something ships.';

/** The --m3e-sys-motion-duration-long1 token in ms: how long the simulated request takes. */
function requestDuration(): number {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--m3e-sys-motion-duration-long1')
    .trim();
  const value = Number.parseFloat(raw);
  return raw.endsWith('ms') ? value : value * 1000;
}

/**
 * Waitlist form island (client:only): the M3 LoadingIndicator while "Adding…".
 *
 * Behavior ported from the old assets/js/app.js unchanged, including that nothing is sent
 * anywhere yet: there is no waitlist backend. Wire a real endpoint into onSubmit to make it real.
 */
export default function WaitlistForm() {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>('idle');
  const [status, setStatus] = useState(IDLE_STATUS);
  const [label, setLabel] = useState('Notify me');

  const onSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = input.current?.value.trim() ?? '';
    if (!EMAIL.test(email)) {
      setState('error');
      setStatus('Enter a valid email address.');
      input.current?.focus();
      return;
    }
    setState('loading');
    setLabel('Adding…');
    window.setTimeout(() => {
      setState('success');
      setStatus('You’re on the list. We’ll write when something ships.');
      setLabel('Added');
      form.reset();
    }, requestDuration());
  };

  const onInput = () => {
    if (state === 'error' || state === 'success') setState('idle');
    if (label === 'Added') setLabel('Notify me');
  };

  const isLoading = state === 'loading';
  return (
    <form className="waitlist-form" data-state={state} noValidate onSubmit={onSubmit}>
      <label htmlFor="home-email">Email address</label>
      <div className="input-row">
        <input
          ref={input}
          id="home-email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
          aria-describedby="email-status"
          aria-invalid={state === 'error' ? true : undefined}
          onInput={onInput}
        />
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
      <p className="form-status" id="email-status" aria-live="polite">
        {status}
      </p>
    </form>
  );
}
