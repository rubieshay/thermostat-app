import { useState, useEffect } from 'react';
import outfitFontURL from "./assets/fonts/outfit.ttf?url";
import materialSymbolsRoundedFontURL from "./assets/fonts/material_symbols_rounded.ttf?url";



export function useFontLoader() {

  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [cssLoaded, setCSSLoaded] = useState(false);

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

  useEffect(() => {
        const checkCSSLoaded = async () => {
      // Wait for all stylesheets to load
      console.log("Waiting on CSS to load...");
      const styleSheets = Array.from(document.styleSheets);
      const cssPromises = styleSheets.map(sheet => {
        return new Promise((resolve) => {
          if (sheet.href) {
            const link = document.querySelector(`link[href="${sheet.href}"]`) as HTMLLinkElement;
            if (link?.sheet) {
              resolve(true);
            } else {
              link?.addEventListener('load', () => resolve(true));
            }
          } else {
            resolve(true);
          }
        });
      });

      await Promise.all(cssPromises);
      console.log("CSS Loaded");

      setCSSLoaded(true);
    }
    checkCSSLoaded();
  },[])

  return [fontsLoaded, cssLoaded];

}