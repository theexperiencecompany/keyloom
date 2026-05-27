import { Anton, Archivo_Black, Bebas_Neue, Poppins } from "next/font/google";

// Display fonts for the caption picker. Loaded on the /shorts route only so
// the home/docs/studio bundles stay lean. next/font registers the font-face
// under the Google family name, so referencing `font-family: 'Anton'`
// (or `'Bebas Neue'`, etc.) inside the Remotion Player just works.
const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-anton",
});
const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-bebas",
});
const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-archivo-black",
});
const poppins = Poppins({
  subsets: ["latin"],
  weight: "900",
  display: "swap",
  variable: "--font-poppins",
});

export default function ShortsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${anton.variable} ${bebas.variable} ${archivoBlack.variable} ${poppins.variable}`}
    >
      {children}
    </div>
  );
}
