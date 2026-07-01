export interface ProjectMeta {
  slug: string;
  name: string;
  /** optional falconry-term gloss, e.g. "the strap on the falcon's leg" */
  gloss?: string;
  /** one-line description */
  summary: string;
  status: string;
  repo: string;
}

export const projects: ProjectMeta[] = [
  {
    slug: 'jess',
    name: 'Jess',
    gloss: "the strap on the falcon's leg",
    summary: 'Streaming agent harness with memory and skills.',
    status: 'work in progress',
    repo: 'https://github.com/guygrigsby/jess',
  },
  {
    slug: 'lmkit',
    name: 'lmkit',
    summary:
      'Train language models from scratch on one machine: pretrain, anneal, SFT, tokenizer, eval, and experiment tracking. Architecture-agnostic, and it runs the same on CUDA or AMD ROCm.',
    status: 'work in progress',
    repo: 'https://github.com/guygrigsby/lmkit',
  },
  {
    slug: 'lmkit-go',
    name: 'lmkit-go',
    summary:
      'From-scratch LLM training in pure Go on an XLA backend, with fused flash attention on both vendors. On NVIDIA it lowers to cuDNN fused SDPA, generalized into a fused-attention abstraction and upstreamed to gomlx/go-xla. On AMD it binds AOTriton flash kernels through an XLA custom-call and a PJRT FFI handler, so all models trains at 2k context on local consumer GPUs.',
    status: 'work in progress',
    repo: 'https://github.com/guygrigsby/lmkit-go',
  },
];
