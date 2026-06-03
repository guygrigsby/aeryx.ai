export interface ProjectMeta {
  slug: string;
  name: string;
  /** falconry-term gloss, e.g. "the strap on the falcon's leg" */
  gloss: string;
  /** one-line description */
  summary: string;
  status: string;
  repo: string;
}

export const projects: ProjectMeta[] = [
  {
    slug: 'talon',
    name: 'Talon',
    gloss: 'the grip',
    summary: 'Fast, secure agent runtime.',
    status: 'work in progress',
    repo: 'https://github.com/guygrigsby/talon',
  },
  {
    slug: 'jess',
    name: 'Jess',
    gloss: "the strap on the falcon's leg",
    summary: 'Streaming agent harness with memory and skills.',
    status: 'work in progress',
    repo: 'https://github.com/guygrigsby/jess',
  },
  {
    slug: 'perch',
    name: 'Perch',
    gloss: 'where it rests',
    summary: 'Shared foundation for daemon and CLI apps: transport, config, lifecycle.',
    status: 'work in progress',
    repo: 'https://github.com/guygrigsby/perch',
  },
  {
    slug: 'rookery',
    name: 'Rookery',
    gloss: 'the nesting colony',
    summary: 'Service template that scaffolds a daemon and CLI on Perch.',
    status: 'work in progress',
    repo: 'https://github.com/guygrigsby/rookery',
  },
  {
    slug: 'mews',
    name: 'Mews',
    gloss: 'the falcon house',
    summary:
      'Supervises named MLX models (chat, vision, embedding, audio) behind one OpenAI-compatible endpoint on Apple Silicon.',
    status: 'work in progress',
    repo: 'https://github.com/guygrigsby/mlx-stack',
  },
  {
    slug: 'pinion',
    name: 'Pinion',
    gloss: 'the flight feathers',
    summary:
      'Gives agent tools a declared effect surface and composes them into a typed dataflow graph, so the risk of a combination is inspectable before it runs.',
    status: 'work in progress',
    repo: 'https://github.com/guygrigsby/pinion',
  },
];
