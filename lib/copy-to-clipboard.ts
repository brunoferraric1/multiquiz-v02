export async function copyToClipboard(text: string): Promise<boolean> {
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Failed to copy using Clipboard API:', error);
    }
  }

  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-1000px';
    textarea.style.left = '-1000px';
    document.body.appendChild(textarea);

    textarea.select();

    try {
      return document.execCommand('copy');
    } catch (error) {
      console.error('Failed to copy using fallback method:', error);
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }

  console.error('Clipboard is not supported in this environment.');
  return false;
}
