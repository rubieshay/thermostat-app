import { useState, useEffect } from "react";
import outfitFontURL from "./assets/fonts/outfit.ttf?url";
import materialSymbolsRoundedFontURL from "./assets/fonts/material_symbols_rounded_minified.ttf?url";

export function useFontLoader() {

    const [fontsLoaded, setFontsLoaded] = useState(false);

    useEffect(() => {
        const loadFonts = async () => {
            const outfitFont = new FontFace("Outfit", `url(${outfitFontURL})`);
            const materialSymbolsRoundedFont = new FontFace("Material Symbols Rounded", `url(${materialSymbolsRoundedFontURL})`, {style: "normal"});

            document.fonts.add(outfitFont);
            document.fonts.add(materialSymbolsRoundedFont);

            await Promise.all([outfitFont.load(), materialSymbolsRoundedFont.load()]);

            await document.fonts.ready;

            setFontsLoaded(true);
        };
        loadFonts();
    }, []);

    return [fontsLoaded];
}