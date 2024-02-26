import sharp from "sharp";

const char =
  "9765432EFGMYAHKBDPQWXNC9765432efgmyahkbdpqwxncvujzsrtLlI!i1'\"`^><|\\/}{][)(?!§¥£€$&80Oo@%#*+=;:~-,. "
    .split("")
    .reverse()
    .join("");

const charLookup: Record<number, string> = {};

const getChar = (r: number, g: number, b: number, hasColor: boolean) => {
  // Get Pixel Brightness
  // https://www.dynamsoft.com/blog/insights/image-processing/image-processing-101-color-space-conversion/
  const brightness = r * 0.299 + g * 0.587 + b * 0.114;
  const ansiColor = hasColor ? `\x1b[38;2;${r};${g};${b}m` : "";
  const charLookupKey = ansiColor + brightness.toString();
  if (charLookup[charLookupKey]) return charLookup[charLookupKey];
  // Get Range of Brightness
  const range = (char.length - 1) / 255;
  // Map Character index from range ((e.g. map 32 from 1 to 256))
  const charIndex = Math.floor(brightness * range);
  // Append text
  // row += char.charAt(charIndex);
  const parsedChar = `${ansiColor}${char.charAt(charIndex)}`;
  charLookup[charLookupKey] = parsedChar;

  return parsedChar;
};

export async function convertImageToAscii(imageFile: string) {
  const image = sharp(imageFile);
  const metadata = await image.metadata();

  const height = process.stdout.rows;
  const width = Math.ceil(height * (metadata.width / metadata.height));

  const resizedImage = await image.resize(width, height).raw().toBuffer();
  const pixelData = Array.from(resizedImage);

  let output = [];
  const paddingLength = Math.floor(process.stdout.columns / 2 - width);

  for (let y = 0; y < height; y++) {
    let row = Array(paddingLength)
      .map(() => "")
      .join(" ");

    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * metadata.channels;
      const r = pixelData[pixelIndex];
      const g = pixelData[pixelIndex + 1];
      const b = pixelData[pixelIndex + 2];

      const char = getChar(r, g, b, true);
      row += char;
      row += char;
    }

    output.push(row);
  }

  return output.join("\n");
}
