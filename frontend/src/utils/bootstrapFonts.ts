import { Text, TextInput, StyleSheet } from 'react-native';

export function bootstrapFonts() {
  const mapStyle = (style: any) => {
    if (!style) {
      return { fontFamily: 'Poppins_400Regular' };
    }

    const flatStyle = StyleSheet.flatten(style);
    const currentFont = flatStyle.fontFamily;
    const currentWeight = flatStyle.fontWeight;

    // 1. If fontFamily is already explicitly mapped to a specific font family, keep it!
    // (e.g. Poppins_900Black or Lora_700Bold)
    if (currentFont && (currentFont.startsWith('Poppins_') || currentFont.startsWith('Lora_'))) {
      return flatStyle;
    }

    // 2. Check if style explicitly requests Poppins
    const wantsPoppins = currentFont === 'Poppins' || currentFont === 'sans-serif';

    // 3. Heuristic check to see if this is button text
    // Button text is typically size 13 to 17, bold, and colored in white, dark, cream, orange, or red.
    const isButtonHeuristic =
      flatStyle.fontSize >= 13 &&
      flatStyle.fontSize <= 17 &&
      (currentWeight === 'bold' ||
        currentWeight === '700' ||
        currentWeight === '800' ||
        currentWeight === '900') &&
      (flatStyle.color === '#FFFFFF' ||
        flatStyle.color === '#fff' ||
        flatStyle.color === '#1C1C2E' ||
        flatStyle.color === '#E11D48' ||
        flatStyle.color === '#FF6B35' ||
        flatStyle.color === '#FF5A30' ||
        flatStyle.color === '#FFEAE3');

    const usePoppins = wantsPoppins || isButtonHeuristic;

    let targetFont = 'Poppins_400Regular';
    const weightStr = currentWeight ? String(currentWeight) : '400';

    if (usePoppins) {
      // Poppins for buttons, overrides, and explicit mappings
      switch (weightStr) {
        case 'bold':
        case '700':
          targetFont = 'Poppins_700Bold';
          break;
        case '900':
          targetFont = 'Poppins_900Black';
          break;
        case '800':
          targetFont = 'Poppins_800ExtraBold';
          break;
        case '600':
          targetFont = 'Poppins_600SemiBold';
          break;
        case '500':
          targetFont = 'Poppins_500Medium';
          break;
        case '300':
          targetFont = 'Poppins_300Light';
          break;
        case '200':
          targetFont = 'Poppins_200ExtraLight';
          break;
        case '100':
          targetFont = 'Poppins_100Thin';
          break;
        default:
          targetFont = 'Poppins_400Regular';
          break;
      }
    } else {
      // Standard elements (headings, titles, item names, normal weights)
      // If it is a light weight (normal / regular <= 400), the user said to use Poppins!
      const isLightWeight =
        weightStr === '100' ||
        weightStr === '200' ||
        weightStr === '300' ||
        weightStr === '400' ||
        weightStr === 'normal';

      if (isLightWeight) {
        // Poppins for descriptions / captions / regular weight body
        switch (weightStr) {
          case '300':
            targetFont = 'Poppins_300Light';
            break;
          case '200':
            targetFont = 'Poppins_200ExtraLight';
            break;
          case '100':
            targetFont = 'Poppins_100Thin';
            break;
          default:
            targetFont = 'Poppins_400Regular';
            break;
        }
      } else {
        // Lora Serif for standard bold / medium / heavy elements (headers, titles, item cards)
        switch (weightStr) {
          case 'bold':
          case '700':
          case '800':
          case '900':
            targetFont = 'Lora_700Bold';
            break;
          case '600':
            targetFont = 'Lora_600SemiBold';
            break;
          case '500':
            targetFont = 'Lora_500Medium';
            break;
          default:
            targetFont = 'Lora_400Regular';
            break;
        }
      }
    }

    const nextStyle = {
      ...flatStyle,
      fontFamily: targetFont,
    };

    // Remove fontWeight to avoid double-bolding/synthetic weight issues on Android
    delete nextStyle.fontWeight;

    return nextStyle;
  };

  // Monkeypatch Text component's internal render function
  const textObj = Text as any;
  const originalTextRender = textObj.render || (textObj.type && textObj.type.render);

  if (originalTextRender) {
    const patchRender = function (this: any, props: any, ref: any) {
      const modifiedProps = {
        ...props,
        style: mapStyle(props?.style),
      };
      return originalTextRender.call(this, modifiedProps, ref);
    };

    if (textObj.render) {
      textObj.render = patchRender;
    } else if (textObj.type && textObj.type.render) {
      textObj.type.render = patchRender;
    }
  } else {
    console.warn('[BootstrapFonts] Could not patch Text.render function.');
  }

  // Monkeypatch TextInput component's internal render function
  const textInputObj = TextInput as any;
  const originalTextInputRender = textInputObj.render || (textInputObj.type && textInputObj.type.render);

  if (originalTextInputRender) {
    const patchRender = function (this: any, props: any, ref: any) {
      const modifiedProps = {
        ...props,
        style: mapStyle(props?.style),
      };
      return originalTextInputRender.call(this, modifiedProps, ref);
    };

    if (textInputObj.render) {
      textInputObj.render = patchRender;
    } else if (textInputObj.type && textInputObj.type.render) {
      textInputObj.type.render = patchRender;
    }
  } else {
    console.warn('[BootstrapFonts] Could not patch TextInput.render function.');
  }
}
