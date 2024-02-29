class PlaywrightGotoError extends Error {
  public code: string = 'E001';
  constructor(url: string) {
    super(`Failed to load url=${url}`);
  }
}
