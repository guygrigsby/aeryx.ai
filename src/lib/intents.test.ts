import { describe, it, expect } from 'vitest';
import { resolveIntent } from './intents';

describe('resolveIntent', () => {
  it('maps contact phrasings to contact', () => {
    for (const s of ['how do I reach you?', 'what is your email', 'can I get in touch']) {
      expect(resolveIntent(s)).toBe('contact');
    }
  });

  it('maps booking phrasings to book', () => {
    for (const s of ['are you available?', 'can we schedule a call', 'book time']) {
      expect(resolveIntent(s)).toBe('book');
    }
  });

  it('maps build/project phrasings to ls', () => {
    for (const s of ['what do you build?', 'show me your projects', 'what are you working on']) {
      expect(resolveIntent(s)).toBe('ls');
    }
  });

  it('maps research phrasings to research', () => {
    for (const s of ['what is your research', 'any papers?', 'tell me about the attention work']) {
      expect(resolveIntent(s)).toBe('research');
    }
  });

  it('maps about phrasings to about', () => {
    for (const s of ['who are you', 'tell me about yourself', 'what is your background']) {
      expect(resolveIntent(s)).toBe('about');
    }
  });

  it('routes egg and greeting phrases to their tokens', () => {
    expect(resolveIntent('are you an AI?')).toBe('honesty');
    expect(resolveIntent('is this chatgpt')).toBe('honesty');
    expect(resolveIntent('sudo hire guy')).toBe('hire');
    expect(resolveIntent('man guy')).toBe('man');
    expect(resolveIntent('falcon')).toBe('falcon');
    expect(resolveIntent('hey')).toBe('hello');
  });

  it('returns null for input it cannot place', () => {
    expect(resolveIntent('frobnicate the quux')).toBeNull();
    expect(resolveIntent('   ')).toBeNull();
  });
});
