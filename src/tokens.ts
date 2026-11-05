// ─── Design tokens & Dynamic Themes ───────────────

const sp = [0, 4, 8, 12, 16, 20, 24, 0, 32, 0, 40, 0, 48, 0, 0, 0, 64] as const;

export const sharedTokens = {
  font: {
    sans: 'Hind',
    sansMed: 'Hind-Medium',
    sansSemi: 'Hind-SemiBold',
    sansBold: 'Hind-Bold',
    display: 'VesperLibre-Black',
    mono: 'DMMono-Regular',
  },
  radius: { pill: 9999, xl: 28, lg: 24, md: 16, sm: 12 }, // Updated for Bento
  spacing: sp,
  shadow: {
    soft: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 5,
    },
    gentle: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 2,
    },
    hard: {
      shadowColor: '#000000',
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 0,
      elevation: 4,
    }
  },
  strokeWidth: { sw: 1.5, swThick: 2.5 },
  typography: {
    displayLarge: { size: 42, weight: '400' as const },
    headlineLarge: { size: 28, weight: '400' as const },
    titleLarge: { size: 20, weight: '500' as const },
    bodyLarge: { size: 16, weight: '400' as const },
    labelMedium: { size: 12, weight: '500' as const },
  }
} as const;

export interface ThemeColors {
  bg: string;
  bgRaised: string;
  bgDeep: string;
  stroke: string;
  strokeDim: string;
  ink: string;
  inkMid: string;
  inkDim: string;
  accent: string;
  accentDark: string;
  accentDim: string;
  accentBg: string;
  white: string;
  shadow: string;
  bgHighlight: string;
}

export type ThemeName = 'classic' | 'nord' | 'lavender' | 'ocean' | 'forest' | 'sunset' | 'midnight' | 'rose' | 'coffee' | 'neon' | 'mint' | 'mononote';

export interface ThemeVariant {
  light: ThemeColors;
  dark: ThemeColors;
}

export const themes: Record<ThemeName, ThemeVariant> = {
  classic: {
    light: {
      bg: '#D9D7D2', bgRaised: '#E2E0DB', bgDeep: '#C8C6C1',
      stroke: '#2B2926', strokeDim: '#9B9790', ink: '#1C1A17',
      inkMid: '#5A5751', inkDim: '#8E8B85', accent: '#C14E28',
      accentDark: '#8B3118', accentDim: '#E8866A', accentBg: '#F2D5C8',
      white: '#F5F3EF', shadow: '#B0AEA9', bgHighlight: '#E0E0E0',
    },
    dark: {
      bg: '#1C1A17', bgRaised: '#2B2926', bgDeep: '#12110F',
      stroke: '#3D3A36', strokeDim: '#2B2926', ink: '#D9D7D2',
      inkMid: '#9B9790', inkDim: '#696660', accent: '#E8866A',
      accentDark: '#C14E28', accentDim: '#8B3118', accentBg: '#2B2926',
      white: '#F5F3EF', shadow: '#000000', bgHighlight: '#3D3A36',
    }
  },
  nord: {
    light: {
      bg: '#ECEFF4', bgRaised: '#FFFFFF', bgDeep: '#E5E9F0',
      stroke: '#D8DEE9', strokeDim: '#E5E9F0', ink: '#2E3440',
      inkMid: '#3B4252', inkDim: '#4C566A', accent: '#5E81AC',
      accentDark: '#4C566A', accentDim: '#81A1C1', accentBg: '#E5E9F0',
      white: '#FFFFFF', shadow: '#D8DEE9', bgHighlight: '#E5E9F0',
    },
    dark: {
      bg: '#2E3440', bgRaised: '#3B4252', bgDeep: '#434C5E',
      stroke: '#4C566A', strokeDim: '#434C5E', ink: '#ECEFF4',
      inkMid: '#E5E9F0', inkDim: '#D8DEE9', accent: '#88C0D0',
      accentDark: '#81A1C1', accentDim: '#5E81AC', accentBg: '#3B4252',
      white: '#FFFFFF', shadow: '#000000', bgHighlight: '#4C566A',
    }
  },
  lavender: {
    light: {
      bg: '#F5F3F7', bgRaised: '#FFFFFF', bgDeep: '#EAE6F0',
      stroke: '#D5CDE3', strokeDim: '#EAE6F0', ink: '#4A3B5D',
      inkMid: '#695A7E', inkDim: '#8E839E', accent: '#9D7BCE',
      accentDark: '#7A5CA5', accentDim: '#BFA8DF', accentBg: '#F0EAF8',
      white: '#FFFFFF', shadow: '#D5CDE3', bgHighlight: '#EAE6F0',
    },
    dark: {
      bg: '#1A1621', bgRaised: '#251F2E', bgDeep: '#110D17',
      stroke: '#3B3247', strokeDim: '#251F2E', ink: '#ECE7F0',
      inkMid: '#BFA8DF', inkDim: '#8E839E', accent: '#BFA8DF',
      accentDark: '#9D7BCE', accentDim: '#7A5CA5', accentBg: '#251F2E',
      white: '#FFFFFF', shadow: '#000000', bgHighlight: '#3B3247',
    }
  },
  ocean: {
    light: {
      bg: '#EAF7F7', bgRaised: '#FFFFFF', bgDeep: '#D4EEEE',
      stroke: '#A8DADA', strokeDim: '#D4EEEE', ink: '#1D4545',
      inkMid: '#397B7B', inkDim: '#6DAEAE', accent: '#008080',
      accentDark: '#004D4D', accentDim: '#4CB2B2', accentBg: '#E6F2F2',
      white: '#FFFFFF', shadow: '#A8DADA', bgHighlight: '#D4EEEE',
    },
    dark: {
      bg: '#0D1A1A', bgRaised: '#162B2B', bgDeep: '#060D0D',
      stroke: '#1F4737', strokeDim: '#162B2B', ink: '#E2F2F2',
      inkMid: '#86BDBD', inkDim: '#529191', accent: '#4CB2B2',
      accentDark: '#008080', accentDim: '#004D4D', accentBg: '#162B2B',
      white: '#FFFFFF', shadow: '#000000', bgHighlight: '#1F4737',
    }
  },
  forest: {
    light: {
      bg: '#F4F7F4', bgRaised: '#FFFFFF', bgDeep: '#E1E9E2',
      stroke: '#C8DAC9', strokeDim: '#E1E9E2', ink: '#2A3F2D',
      inkMid: '#516E54', inkDim: '#829C85', accent: '#478A52',
      accentDark: '#2C5933', accentDim: '#7DBA88', accentBg: '#E9F2EA',
      white: '#FFFFFF', shadow: '#C8DAC9', bgHighlight: '#E1E9E2',
    },
    dark: {
      bg: '#111A13', bgRaised: '#1A291E', bgDeep: '#0A100C',
      stroke: '#28412F', strokeDim: '#1A291E', ink: '#E5EDE6',
      inkMid: '#8BAA91', inkDim: '#59795F', accent: '#7DBA88',
      accentDark: '#478A52', accentDim: '#2C5933', accentBg: '#1A291E',
      white: '#FFFFFF', shadow: '#000000', bgHighlight: '#28412F',
    }
  },
  sunset: {
    light: {
      bg: '#FFF8F0', bgRaised: '#FFFFFF', bgDeep: '#FFECCC',
      stroke: '#FAD49E', strokeDim: '#FFECCC', ink: '#4A2A00',
      inkMid: '#8A5400', inkDim: '#B87A1A', accent: '#E65C00',
      accentDark: '#B34700', accentDim: '#FF8533', accentBg: '#FFF0E6',
      white: '#FFFFFF', shadow: '#FAD49E', bgHighlight: '#FFECCC',
    },
    dark: {
      bg: '#1A0F00', bgRaised: '#2E1A00', bgDeep: '#0D0800',
      stroke: '#4D2F00', strokeDim: '#2E1A00', ink: '#FFF0E6',
      inkMid: '#FFB84D', inkDim: '#CC8800', accent: '#FF8533',
      accentDark: '#E65C00', accentDim: '#B34700', accentBg: '#2E1A00',
      white: '#FFFFFF', shadow: '#000000', bgHighlight: '#4D2F00',
    }
  },
  midnight: {
    light: {
      bg: '#EAF0F8', bgRaised: '#FFFFFF', bgDeep: '#D4E2F1',
      stroke: '#B4CCE4', strokeDim: '#D4E2F1', ink: '#1D2A44',
      inkMid: '#4B5E85', inkDim: '#7A8EB4', accent: '#3E5FA5',
      accentDark: '#243A67', accentDim: '#708DCA', accentBg: '#E2EAF5',
      white: '#FFFFFF', shadow: '#B4CCE4', bgHighlight: '#D4E2F1',
    },
    dark: {
      bg: '#0A0F1A', bgRaised: '#121C2B', bgDeep: '#05070D',
      stroke: '#1F2D44', strokeDim: '#121C2B', ink: '#DDE5F2',
      inkMid: '#899ECA', inkDim: '#576C98', accent: '#708DCA',
      accentDark: '#3E5FA5', accentDim: '#243A67', accentBg: '#121C2B',
      white: '#FFFFFF', shadow: '#000000', bgHighlight: '#1F2D44',
    }
  },
  rose: {
    light: {
      bg: '#FCF3F5', bgRaised: '#FFFFFF', bgDeep: '#F5E1E6',
      stroke: '#E8C2CA', strokeDim: '#F5E1E6', ink: '#4D1D27',
      inkMid: '#884654', inkDim: '#BD7A89', accent: '#D14D6B',
      accentDark: '#9C3149', accentDim: '#E6839A', accentBg: '#FBE9ED',
      white: '#FFFFFF', shadow: '#E8C2CA', bgHighlight: '#F5E1E6',
    },
    dark: {
      bg: '#1C1113', bgRaised: '#2C1A1E', bgDeep: '#120B0D',
      stroke: '#4C2830', strokeDim: '#2C1A1E', ink: '#FBECEF',
      inkMid: '#DDA3B2', inkDim: '#A86676', accent: '#E6839A',
      accentDark: '#D14D6B', accentDim: '#9C3149', accentBg: '#2C1A1E',
      white: '#FFFFFF', shadow: '#000000', bgHighlight: '#4C2830',
    }
  },
  coffee: {
    light: {
      bg: '#F5F2ED', bgRaised: '#FFFFFF', bgDeep: '#EAE1D6',
      stroke: '#D6C7B3', strokeDim: '#EAE1D6', ink: '#3B291D',
      inkMid: '#6B5140', inkDim: '#9D806D', accent: '#8C5A35',
      accentDark: '#5E381C', accentDim: '#B88B69', accentBg: '#F0E7DD',
      white: '#FFFFFF', shadow: '#D6C7B3', bgHighlight: '#EAE1D6',
    },
    dark: {
      bg: '#17120F', bgRaised: '#241D17', bgDeep: '#0D0A08',
      stroke: '#3C3026', strokeDim: '#241D17', ink: '#E8DFD7',
      inkMid: '#C1A18A', inkDim: '#8A6E59', accent: '#B88B69',
      accentDark: '#8C5A35', accentDim: '#5E381C', accentBg: '#241D17',
      white: '#FFFFFF', shadow: '#000000', bgHighlight: '#3C3026',
    }
  },
  neon: {
    light: {
      bg: '#F3F4F7', bgRaised: '#FFFFFF', bgDeep: '#E4E7ED',
      stroke: '#CAD0E0', strokeDim: '#E4E7ED', ink: '#1D2129',
      inkMid: '#4E5969', inkDim: '#86909C', accent: '#6325E8',
      accentDark: '#4115A3', accentDim: '#9466FF', accentBg: '#EBE2FC',
      white: '#FFFFFF', shadow: '#CAD0E0', bgHighlight: '#E4E7ED',
    },
    dark: {
      bg: '#08080A', bgRaised: '#121217', bgDeep: '#040405',
      stroke: '#282833', strokeDim: '#121217', ink: '#F2F3F5',
      inkMid: '#A9AEC2', inkDim: '#6C7286', accent: '#9466FF',
      accentDark: '#6325E8', accentDim: '#4115A3', accentBg: '#121217',
      white: '#FFFFFF', shadow: '#000000', bgHighlight: '#282833',
    }
  },
  mint: {
    light: {
      bg: '#F2FCF8', bgRaised: '#FFFFFF', bgDeep: '#E0F5EC',
      stroke: '#BCE6D6', strokeDim: '#E0F5EC', ink: '#194231',
      inkMid: '#397059', inkDim: '#6DAE93', accent: '#18A066',
      accentDark: '#0D6E45', accentDim: '#51C493', accentBg: '#DFF0E9',
      white: '#FFFFFF', shadow: '#BCE6D6', bgHighlight: '#E0F5EC',
    },
    dark: {
      bg: '#081711', bgRaised: '#11291E', bgDeep: '#040D09',
      stroke: '#1F4736', strokeDim: '#11291E', ink: '#DFEEE7',
      inkMid: '#86C5A9', inkDim: '#52977A', accent: '#51C493',
      accentDark: '#18A066', accentDim: '#0D6E45', accentBg: '#11291E',
      white: '#FFFFFF', shadow: '#000000', bgHighlight: '#1F4736',
    }
  },
  mononote: {
    light: {
      bg: '#F6F6F8', bgRaised: '#FFFFFF', bgDeep: '#EFEFF2',
      stroke: '#111113', strokeDim: '#E5E5EA', ink: '#111113',
      inkMid: '#48484A', inkDim: '#8E8E93', accent: '#111113',
      accentDark: '#000000', accentDim: '#3A3A3C', accentBg: '#EBEBED',
      white: '#FFFFFF', shadow: '#D1D1D6', bgHighlight: '#E5E5EA',
    },
    dark: {
      bg: '#000000', bgRaised: '#121214', bgDeep: '#08080A',
      stroke: '#FFFFFF', strokeDim: '#2C2C2E', ink: '#FFFFFF',
      inkMid: '#AEAEB2', inkDim: '#636366', accent: '#FFFFFF',
      accentDark: '#E5E5EA', accentDim: '#8E8E93', accentBg: '#1C1C1E',
      white: '#FFFFFF', shadow: '#000000', bgHighlight: '#242426',
    }
  }
};

export const T = {
  color: themes.classic.light,
  ...sharedTokens
};
