import { describe, expect, it } from 'vitest';

import { CONTACT_REASONS } from '../src/lib/contact';
import { CONTACT_TOPICS, topicFromSearch } from '../src/lib/contactTopics';

describe('contact topics', () => {
  it('has wording for every reason the form accepts, in the same order', () => {
    expect(CONTACT_TOPICS.map((t) => t.id)).toEqual(CONTACT_REASONS.map((r) => r.id));
    for (const topic of CONTACT_TOPICS) {
      expect(topic.chip && topic.hint && topic.placeholder && topic.submit).toBeTruthy();
    }
  });

  it('reads the topic from ?reason= or ?kind=, ignoring unknown ones', () => {
    expect(topicFromSearch('?reason=pricing')).toBe('pricing');
    expect(topicFromSearch('?kind=partnership')).toBe('partnership');
    expect(topicFromSearch('?reason=nope')).toBeNull();
    expect(topicFromSearch('')).toBeNull();
  });
});
