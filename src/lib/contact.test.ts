import { describe, expect, it } from 'vitest';
import { CONTACT_LIMITS, CONTACT_REASONS, composeContactEmail, validateContact } from './contact';

const valid = {
  reason: 'build',
  name: 'Aoife Ryan',
  email: 'aoife@clinic.ie',
  company: 'Ryan Dental',
  message: 'We miss calls at lunchtime and want an agent to book check-ups.',
};

describe('validateContact', () => {
  it('accepts a complete submission and trims it', () => {
    const result = validateContact({ ...valid, name: '  Aoife Ryan  ' });
    expect(result).toEqual({ ok: true, value: { ...valid, reasonOther: '' } });
  });

  it('offers an Other reason last', () => {
    expect(CONTACT_REASONS.at(-1)).toEqual({ id: 'other', label: 'Other' });
  });

  it('requires a known reason', () => {
    const result = validateContact({ ...valid, reason: 'free-money' });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors.reason).toBeTruthy();
  });

  it('requires a description when the reason is Other, and drops it otherwise', () => {
    const missing = validateContact({ ...valid, reason: 'other' });
    expect(!missing.ok && missing.errors.reasonOther).toBeTruthy();

    const given = validateContact({ ...valid, reason: 'other', reasonOther: 'Press enquiry' });
    expect(given.ok && given.value.reasonOther).toBe('Press enquiry');

    const ignored = validateContact({ ...valid, reasonOther: 'stale value' });
    expect(ignored.ok && ignored.value.reasonOther).toBe('');
  });

  it.each(['', 'not-an-email', 'a@b', 'a b@c.ie', 'x@y.ie>'])('rejects the email %j', (email) => {
    const result = validateContact({ ...valid, email });
    expect(!result.ok && result.errors.email).toBeTruthy();
  });

  it('enforces length limits', () => {
    const long = validateContact({
      ...valid,
      name: 'n'.repeat(CONTACT_LIMITS.name + 1),
      company: 'c'.repeat(CONTACT_LIMITS.company + 1),
      message: 'm'.repeat(CONTACT_LIMITS.message + 1),
    });
    expect(!long.ok && Object.keys(long.errors).sort()).toEqual(['company', 'message', 'name']);

    const short = validateContact({ ...valid, message: 'hi' });
    expect(!short.ok && short.errors.message).toBeTruthy();
  });

  it('keeps single-line fields on one line', () => {
    const result = validateContact({ ...valid, name: 'Aoife\r\nBcc: x@evil.test' });
    expect(result.ok && result.value.name).toBe('Aoife Bcc: x@evil.test');
  });

  it('ignores non-string values', () => {
    const result = validateContact({ ...valid, name: { $ne: '' }, message: ['x'] });
    expect(!result.ok && Object.keys(result.errors).sort()).toEqual(['message', 'name']);
  });
});

describe('composeContactEmail', () => {
  it('puts the reason and name in the subject and replies to the sender', () => {
    const result = validateContact({ ...valid, reason: 'other', reasonOther: 'Press enquiry' });
    if (!result.ok) throw new Error('fixture should be valid');
    const email = composeContactEmail(result.value, new Date('2026-11-01T10:00:00Z'));

    expect(email.subject).toBe('[Website] Other: Press enquiry (Aoife Ryan)');
    expect(email.replyTo).toBe('aoife@clinic.ie');
    expect(email.text).toContain('Company: Ryan Dental');
    expect(email.text).toContain('Received: 2026-11-01T10:00:00.000Z');
    expect(email.text).toContain(valid.message);
  });
});
