declare module 'markdown-it-mark' {
  /** Plugin markdown-it que tokeniza `==destaque==` em `<mark>`. */
  const markdownItMark: (md: { use: (...args: unknown[]) => unknown }) => void;
  export default markdownItMark;
}
