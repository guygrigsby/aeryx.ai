export interface ResearchItem {
  slug: string;
  title: string;
  /** one or two sentence plain-language summary */
  summary: string;
  /** link to the writeup (currently GitHub) */
  writeupUrl: string;
  /** optional Hugging Face artifact for the work */
  hfUrl?: string;
}

/** Formal Hugging Face profile. */
export const hfProfile = 'https://huggingface.co/guygrigsby';

export const research: ResearchItem[] = [
  {
    slug: 'diff-mlx',
    title: 'Differential Transformer on Apple Silicon',
    summary:
      'Paired-init reproduction of differential attention in MLX with custom Metal kernels. An honest negative at small scale: no generalization edge over vanilla, cross-checked against the PyTorch reference.',
    writeupUrl: 'https://github.com/guygrigsby/diff-mlx/blob/main/docs/2026-05-23-final-writeup.md',
    hfUrl: 'https://huggingface.co/guygrigsby/diff-mlx',
  },
  {
    slug: 'guardian',
    title: 'Guardian: a dialect-fair hate-speech classifier',
    summary:
      'Hate-speech classifier fine-tuned from ModernBERT-large that closes the dialect-fairness gap. Off-the-shelf models flag benign African-American English at over 2x the rate of General-American English; Guardian cuts that bias roughly 5x while holding 93% recall. The fix turned out to be volume of high-AAE-safe training text, not loss reweighting or adversarial methods.',
    writeupUrl: 'https://huggingface.co/aeryx-ai/guardian-dialect-fair-hate',
  },
];
