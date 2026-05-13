export async function translateText(
  text: string,
  target: 'es' | 'en'
): Promise<string> {

  if (!text) return '';

  if (target === 'es') {
    return text;
  }

  try {

    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=${target}&dt=t&q=${encodeURIComponent(text)}`
    );

    const data = await response.json();

    return data[0]
      ?.map((item: any) => item[0])
      ?.join('') || text;

  } catch {
    return text;
  }
}