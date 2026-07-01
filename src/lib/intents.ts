export interface Intent {
  pattern: RegExp;
  command: string;
}

// Ordered: first match wins. Specific egg and greeting patterns sit above the
// broad topic patterns so a precise phrase is not swallowed by a general one.
export const intents: Intent[] = [
  { pattern: /\bare you (an?\s+)?(ai|bot|chat\s?gpt|gpt|llm|robot|real|human|a person)\b/, command: 'honesty' },
  { pattern: /\bis this (chat\s?gpt|an? (ai|llm|bot))\b/, command: 'honesty' },
  { pattern: /\bsudo\s+hire\b|\bhire (you|guy|him)\b/, command: 'hire' },
  { pattern: /\bman\s+(guy|aeryx)\b/, command: 'man' },
  { pattern: /\b(falcon|fly)\b/, command: 'falcon' },
  { pattern: /^(hi|hey|hello|yo|howdy|sup|hiya)\b/, command: 'hello' },
  { pattern: /\b(email|e-mail|reach|contact|hire|get in touch|talk to|message|connect)\b/, command: 'contact' },
  { pattern: /\b(book|call|meeting|schedule|availab|free to|set up|chat with)/, command: 'book' },
  { pattern: /\b(research|paper|writeup|write-up|hugging\s?face|\bml\b|model|classifier|attention)/, command: 'research' },
  { pattern: /\b(project|build|building|built|working on|work on|make|made|creating|ship)/, command: 'ls' },
  { pattern: /\b(who|about|background|experience|yourself|resume|cv|bio|do you do|guy)\b/, command: 'about' },
];

export function resolveIntent(input: string): string | null {
  const s = input.trim().toLowerCase();
  if (!s) return null;
  for (const { pattern, command } of intents) {
    if (pattern.test(s)) return command;
  }
  return null;
}
