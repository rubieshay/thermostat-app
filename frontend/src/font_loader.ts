import { useState, useEffect } from 'react';
import outfitFontURL from "./assets/fonts/outfit.ttf?url";
import materialSymbolsRoundedFontURL from "./assets/fonts/material_symbols_rounded.ttf?url";



export function useFontLoader() {

  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const loadFonts = async () => {
      const font1 = new FontFace('Outfit',`url(${outfitFontURL})`);
      const font2 = new FontFace('Material Symbols Rounded', `url(${materialSymbolsRoundedFontURL})`, {style: "normal"});

      console.log("About to add fonts to document");
      document.fonts.add(font1);
      document.fonts.add(font2);
      console.log("fonts added to document");

      await Promise.all([font1.load(), font2.load()]);

      console.log("Promises resolved fonts loaded...")

      await document.fonts.ready;

      console.log("Fonts are ready");

      setFontsLoaded(true);
    };

    loadFonts();
  }, []);

  return [fontsLoaded];

}