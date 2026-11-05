export interface ChangelogItem {
    version: string;
    date: string;
    title?: {
        en: string;
        hi: string;
        mr?: string;
        bn?: string;
        te?: string;
        ta?: string;
    };
    changes: {
        en: string[];
        hi: string[];
        mr?: string[];
        bn?: string[];
        te?: string[];
        ta?: string[];
    };
}

export const APP_CHANGELOG: ChangelogItem[] = [
    {
        version: "2.19.32",
        date: "2026-11-05",
        title: {
            en: "Mononote Minimalist Theme & Glance Lock Screen Integration",
            hi: "मोनोनोट मिनिमलिस्ट थीम और ग्लांस लॉक स्क्रीन एकीकरण",
        },
        changes: {
            en: [
                "Theme: Added dedicated Mononote theme with warm off-white, pure OLED dark mode, and high-contrast minimal aesthetics across the entire app.",
                "Glance Note: Integrated native Android ongoing lock screen notifications with 1-tap Done and Dismiss actions directly from the editor header.",
                "UI/UX: Removed fragmented editor mode toggles in favor of the seamless full-app Mononote theme experience.",
                "Contrast: Optimized action buttons and badges for flawless contrast in both light and dark minimalist modes."
            ],
            hi: [
                "थीम: पूरे ऐप में वार्म ऑफ-व्हाइट, प्योर OLED डार्क मोड और हाई-कंट्रास्ट मिनिमल लुक के साथ समर्पित मोनोनोट थीम जोड़ी गई।",
                "ग्लांस नोट: एडिटर हेडर से सीधे 1-टैप डन और डिसमिस क्रियाओं के साथ नेटिव एंड्रॉइड लॉक स्क्रीन नोटिफिकेशन जोड़ा गया।",
                "UI/UX: निर्बाध फुल-ऐप मोनोनोट थीम अनुभव के लिए एडिटर मोड टॉगल को हटाया गया।",
                "कंट्रास्ट: लाइट और डार्क दोनों मोड्स में उत्कृष्ट पठनीयता के लिए बटन और बैज को अनुकूलित किया गया।"
            ]
        }
    },
    {
    version: "2.17.34",
    date: "2026-04-23",
    title: {
      en: "Editor Keyboard Fix & Code Refactor",
      hi: "एडिटर कीबोर्ड फिक्स और कोड रिफैक्टर",
    },
    changes: {
      en: [
        "Editor: Fixed keyboard scrolling obstruction — bottom content is now fully visible when keyboard is active on Android.",
        "Editor: Added auto-scroll to cursor position on new note screen for smoother typing experience.",
        "Refactor: Extracted shared editor CSS template into a reusable utility, eliminating 50+ lines of duplicated code.",
        "Refactor: Replaced hardcoded 'Poppins-SemiBold' in editor CSS with dynamic font tokens.",
        "F-Droid: Updated build recipe with proper scanignore configuration for React Native dependencies."
      ],
      hi: [
        "एडिटर: कीबोर्ड स्क्रॉलिंग की बाधा ठीक की गई — Android पर कीबोर्ड खुलने पर अब नीचे का कंटेंट पूरी तरह दिखाई देता है।",
        "एडिटर: नए नोट स्क्रीन पर कर्सर पोजिशन पर ऑटो-स्क्रॉल जोड़ा गया।",
        "रिफैक्टर: साझा एडिटर CSS टेम्पलेट को एक पुन: प्रयोज्य यूटिलिटी में निकाला गया, 50+ पंक्तियों का डुप्लिकेट कोड हटाया।",
        "रिफैक्टर: एडिटर CSS में हार्डकोडेड 'Poppins-SemiBold' को डायनामिक फ़ॉन्ट टोकन से बदला गया।",
        "F-Droid: React Native डिपेंडेंसीज़ के लिए उचित scanignore कॉन्फ़िगरेशन के साथ बिल्ड रेसिपी अपडेट की गई।"
      ]
    }
  },
    {
    version: "2.17.33",
    date: "2026-03-24",
    title: {
      en: "F-Droid Compliance & UX Polish",
      hi: "F-Droid अनुपालन और यूएक्स पॉलिश",
    },
    changes: {
      en: [
        "F-Droid: Removed Sentry tracking for a privacy-focused open-source release.",
        "Settings: Standardized Spark AI button layout with improved centering.",
        "Editor: Fixed undo/redo crashes and polished modal interfaces for Find & Replace.",
        "Trash: Added 'Empty All' feature with a permanent deletion confirmation."
      ],
      hi: [
        "F-Droid: गोपनीयता-केंद्रित और ओपन-सोर्स रिलीज़ के लिए सेंट्री (Sentry) ट्रैकिंग को हटा दिया गया।",
        "सेटिंग्स: बेहतर सेंटरिंग के साथ स्पार्क एआई बटन लेआउट को मानकीकृत किया गया।",
        "एडिटर: अनडू/रीडू क्रैश को ठीक किया गया और फाइंड एंड रिप्लेस के लिए इंटरफेस को व्यवस्थित किया गया।",
        "ट्रैश: स्थायी विलोपन पुष्टिकरण (confirmation) के साथ 'एम्प्टी ऑल' (Empty All) सुविधा जोड़ी गई।"
      ]
    }
  },
    {
    version: "2.17.32",
    date: "2026-03-24",
    title: {
      en: "Targeted UX Polish",
      hi: "लक्षित यूएक्स पॉलिश (UX Polish)",
    },
    changes: {
      en: [
        "Editor: Elevated Spark AI, Undo, Redo, and Search to a primary fixed toolbar for constant access.",
        "Settings: Standardized card layouts and centered all button labels for better visual balance.",
        "Clean UX: Removed the redundant font resizer from Settings as part of the interface declutter."
      ],
      hi: [
        "एडिटर: स्पार्क एआई (Spark AI), अनडू, रीडू और सर्च को हमेशा सुलभ बनाने के लिए एक फिक्स्ड टूलबार में ले जाया गया।",
        "सेटिंग्स: बेहतर विजुअल बैलेंस के लिए कार्ड लेआउट को मानकीकृत किया गया और सभी बटन लेबल को सेंटर किया गया।",
        "क्लीन यूएक्स: इंटरफेस को व्यवस्थित करने के लिए सेटिंग्स से अनावश्यक फॉन्ट रिसाइज़र को हटा दिया गया।"
      ]
    }
  },
    {
    version: "2.17.28",
    date: "2026-03-23",
    title: {
      en: "Critical Google Auth Structural Fix",
      hi: "महत्वपूर्ण Google Auth संरचनात्मक फिक्स",
    },
    changes: {
      en: [
        "Google Sign-In: Fixed a massive Android build regression where the production APK was silently being signed with a debug certificate, causing Google auth to block access."
      ],
      hi: [
        "Google साइन-इन: Android बिल्ड में एक बड़ी समस्या को ठीक किया गया जहाँ प्रोडक्शन APK पर गलती से डिबग सर्टिफिकेट लगाया जा रहा था, जिससे Google Auth लॉगिन रोक रहा था।"
      ]
    }
  },
    {
    version: "2.17.27",
    date: "2026-03-21",
    title: {
      en: "Direct Update Installation Restore",
      hi: "डायरेक्ट अपडेट इंस्टालेशन रिस्टोर",
    },
    changes: {
      en: [
        "In-App Updater: Restored the native Android module responsible for direct APK installations that was inadvertently removed during a previous prebuild sequence."
      ],
      hi: [
        "इन-ऐप अपडेटर: डायरेक्ट APK इंस्टालेशन के लिए जिम्मेदार नेटिव Android मॉड्यूल को रिस्टोर किया गया जो पिछले प्रीबिल्ड के दौरान गलती से हटा दिया गया था।"
      ]
    }
  },
    {
    version: "2.17.26",
    date: "2026-03-21",
    title: {
      en: "Seamless Splash Logo Polish",
      hi: "निर्बाध स्पैश लोगो पॉलिश",
    },
    changes: {
      en: [
        "Uninterrupted Logo: Updated native window layouts to keep the splash logo perfectly visible throughout the entire boot sequence."
      ],
      hi: [
        "निर्बाध लोगो: पूरी बूट प्रक्रिया के दौरान स्पैश लोगो को पूरी तरह से दिखाई देने के लिए नेटिव विंडो लेआउट को अपडेट किया गया।"
      ]
    }
  },
    {
    version: "2.17.25",
    date: "2026-03-21",
    title: {
      en: "Launch Polish & Auth Sync",
      hi: "लॉन्च पॉलिश और ऑथ सिंक",
    },
    changes: {
      en: [
        "White Flash Eliminated: Optimized native Android themes to use synchronized DayNight backgrounds.",
        "Auth Recovery: Added support for automatic fallback to native Google config if the web client drifts.",
        "Internal: Verified production SHA-1 for Firebase consistency."
      ],
      hi: [
        "वाइट फ्लैश समाप्त: सिंक्रोनाइज़्ड DayNight बैकग्राउंड का उपयोग करने के लिए नेटिव एंड्रॉइड थीम को ऑप्टिमाइज़ किया गया।",
        "ऑथ रिकवरी: वेब क्लाइंट में समस्या होने पर नेटिव गूगल कॉन्फ़िगरेशन पर ऑटोमैटिक फॉलबैक सपोर्ट जोड़ा गया।",
        "इंटरनल: फायरबेस स्थिरता के लिए प्रोडक्शन SHA-1 का सत्यापन किया गया।"
      ]
    }
  },
    {
    version: "2.17.24",
    date: "2026-03-21",
    title: {
      en: "Critical Hotfix: Startup Crash",
      hi: "महत्वपूर्ण हॉटफिक्स: स्टार्टअप क्रैश",
    },
    changes: {
      en: [
        "Fixed a critical ReferenceError during startup by restoring missing 'useState' hooks.",
        "Ensured smooth transition for the Pro-Level splash handoff."
      ],
      hi: [
        "लापता 'useState' हुक को बहाल करके स्टार्टअप के दौरान एक महत्वपूर्ण ReferenceError को ठीक किया गया।",
        "प्रो-लेवल स्पैश हैंडऑफ के लिए सुचारू ट्रांजिशन सुनिश्चित किया गया।"
      ]
    }
  },
    {
    version: "2.17.23",
    date: "2026-03-20",
    title: {
      en: "Pro-Level Splash Handoff",
      hi: "प्रो-लेवल स्पैश हैंडऑफ",
    },
    changes: {
      en: [
        "Pro-Level Splash: Implemented a zero-flicker transition from native splash to app UI with Five-Point Sync.",
        "Theme-Aware Splash: The splash background and icon now perfectly match the user's selected app palette.",
        "SmoothLanding Integration: Added a skeleton reveal during note loading for a more premium launch feel."
      ],
      hi: [
        "प्रो-लेवल स्पैश: 'फाइव-पॉइंट सिंक' के साथ नेटिव स्पैश से ऐप UI तक एक जीरो-फ्लिकर ट्रांजिशन लागू किया गया।",
        "थीम-अवेयर स्पैश: स्पैश बैकग्राउंड और आइकन अब यूजर द्वारा चुने गए ऐप पैलेट से पूरी तरह मेल खाते हैं।",
        "स्मूथ लैंडिंग इंटीग्रेशन: प्रीमियम लॉन्च अनुभव के लिए नोट लोडिंग के दौरान स्केलेटन रिवील जोड़ा गया।"
      ]
    }
  },
    {
    version: "2.17.22",
    date: "2026-03-18",
    title: {
      en: "Clean Build & Cache Bust",
      hi: "क्लीन बिल्ड और कैश बस्ट",
    },
    changes: {
      en: [
        "Force Clean Build: Busted GitHub Actions cache to ensure new assets are correctly processed.",
        "Splash Update: Verified that new splash icons are correctly included in the standalone APK."
      ],
      hi: [
        "फोर्स्ड क्लीन बिल्ड: GitHub Actions कैश को रीसेट किया गया ताकि नए एसेट्स सही से प्रोसेस हों।",
        "स्पैश अपडेट: सुनिश्चित किया गया कि नए स्पैश आइकन APK में सही से शामिल हैं।"
      ]
    }
  },
    {
    version: "2.17.21",
    date: "2026-03-18",
    title: {
      en: "Visual Refresh",
      hi: "विजुअल रिफ्रेश",
    },
    changes: {
      en: [
        "Asset Refresh: Updated splash icons and adaptive icons for better theme consistency.",
        "Dynamic Splash: Added support for light/dark mode splash screens that match system settings automatically."
      ],
      hi: [
        "विजुअल रिफ्रेश: बेहतर थीम स्थिरता के लिए स्पैश आइकन और एडेप्टिव आइकन अपडेट किए गए।",
        "डायनामिक स्पैश: लाइट/डार्क मोड स्पैश स्क्रीन सपोर्ट जोड़ा गया जो सिस्टम सेटिंग के अनुसार ऑटोमैटिक बदलता है।"
      ]
    }
  },
    {
    version: "2.17.20",
    date: "2026-03-18",
    title: {
      en: "Crash Fix & E2E Testing",
      hi: "क्रैश फिक्स और E2E टेस्टिंग",
    },
    changes: {
      en: [
        "Selection Crash Fix: Resolved 'Invariant Violation' when selecting multiple notes by replacing web tags with native ones.",
        "Maestro E2E Suite: Added automated testing flows for note creation, search, and navigation for better production stability.",
        "UI Instrumentation: Added testIDs to key buttons and inputs for reliable automated validation."
      ],
      hi: [
        "सिलेक्शन क्रैश फिक्स: वेब टैग को नेटिव टैग से बदलकर मल्टीपल नोट्स चुनते समय होने वाले क्रैश को ठीक किया गया।",
        "Maestro E2E सुइट: बेहतर स्थिरता के लिए नोट क्रिएशन, सर्च और नेविगेशन के लिए ऑटोमेटेड टेस्टिंग फ्लो जोड़े गए।",
        "UI इंस्ट्रूमेंटेशन: विश्वसनीय ऑटोमेटेड वैलिडेशन के लिए मुख्य बटनों और इनपुट में testID जोड़े गए।"
      ]
    }
  },
    {
    version: "2.17.19",
    date: "2026-03-18",
    title: {
      en: "DB Fix & UI Polish",
      hi: "DB फिक्स और UI पॉलिश",
    },
    changes: {
      en: [
        "DB Crash Fix: Resolved 'duplicate column name: is_deleted' conflict on existing installs with a safe idempotent migration check.",
        "Download Button: Fixed width jitter during APK download — button stays a consistent 140px wide.",
        "Text Size Picker: Replaced invisible-dot slider with a beautiful growing-A circle row for intuitive sizing.",
        "Icon Color: Adaptive icon background now matches the Tippani (#D9D7D2) theme for a seamless launch."
      ],
      hi: [
        "DB क्रैश फिक्स: मौजूदा इंस्टॉल पर 'duplicate column name: is_deleted' एरर को सुरक्षित idempotent माइग्रेशन चेक से ठीक किया।",
        "डाउनलोड बटन: APK डाउनलोड दौरान साइज़ बदलने की समस्या ठीक — अब बटन 140px चौड़ा रहता है।",
        "फ़ॉन्ट साइज़ पिकर: अदृश्य डॉट स्लाइडर को सुंदर बढ़ते 'A' सर्किल रो से बदला गया।",
        "आइकन रंग: एडेप्टिव आइकन बैकग्राउंड अब Tippani (#D9D7D2) थीम से मेल खाता है।"
      ]
    }
  },
  {
    version: "2.17.18",
    date: "2026-03-18",
    title: {
      en: "Permanent Splash Fix",
      hi: "स्थायी स्पैश फिक्स",
    },
    changes: {
      en: [
        "Root Cause Fixed: Implemented Android 12+ SplashScreen API correctly using Theme.SplashScreen parent.",
        "Grey Flash Eliminated: Removed windowIsTranslucent causing the infamous grey gap.",
        "Zero-Gap Native Entry: App transitions from native splash directly to dashboard with no intermediary screen.",
        "Based on proven simple-notes-sync pattern that works flawlessly."
      ],
      hi: [
        "मूल कारण ठीक: Theme.SplashScreen पैरेंट का उपयोग करके Android 12+ SplashScreen API सही तरीके से लागू किया गया।",
        "ग्रे फ्लैश समाप्त: windowIsTranslucent जो ग्रे गैप का कारण था, हटा दिया गया।",
        "जीरो-गैप नेटिव एंट्री: ऐप नेटिव स्पैश से सीधे डैशबोर्ड में जाता है।",
        "सिद्ध simple-notes-sync पैटर्न पर आधारित।"
      ]
    }
  },
  {
    version: "2.17.17",
    date: "2026-03-17",
    title: {
      en: "Build Stability Fix",
      hi: "बिल्ड स्टेबिलिटी फिक्स",
    },
    changes: {
      en: [
        "Dependency Fix: Restored missing expo-status-bar required for routing.",
        "Improved Reliability: Corrected package mapping for faster dependency resolution."
      ],
      hi: [
        "डिपेंडेंसी फिक्स: रूटिंग के लिए आवश्यक अनुपलब्ध expo-status-bar को बहाल किया गया।",
        "बेहतर विश्वसनीयता: तेज़ डिपेंडेंसी रिज़ॉल्यूशन के लिए सही पैकेज मैपिंग।"
      ]
    }
  },
  {
    version: "2.17.16",
    date: "2026-03-17",
    title: {
      en: "Absolute Native Entry",
      hi: "पूर्ण नेटिव एंट्री",
    },
    changes: {
      en: [
        "Zero-Gap Launch: Redundant JS splash removed for instant startup.",
        "Native Handoff: Utilized native SplashScreen API for maximum speed.",
        "Premium Clean Look: Set splash backgrounds to pure White and Black.",
        "Optimized Weight: Stripped legacy animation code for lighter bundle."
      ],
      hi: [
        "जीरो-गैप लॉन्च: तत्काल स्टार्टअप के लिए अनावश्यक JS स्पैश को हटाया गया।",
        "नेटिव हैंडऑफ़: अधिकतम गति के लिए नेटिव स्पैशस्क्रीन API का उपयोग।",
        "प्रीमियम क्लीन लुक: स्पैश बैकग्राउंड को शुद्ध सफेद और काले रंग में सेट किया गया।",
        "ऑप्टिमाइज्ड वेट: हल्के बंडल के लिए लीगेसी एनिमेशन कोड को हटाया गया।"
      ]
    }
  },
    {
        version: "2.17.15",
        date: "2026-03-17",
        title: {
            en: "Simple Notes Perfection",
            hi: "सरल नोट्स पूर्णता",
        },
        changes: {
            en: [
                "Ultra-Fast Reveal: High-speed, 400ms cinematic entry transition.",
                "Seamless UI Handoff: Eliminated 'falling elements' and grey flashes.",
                "Material 3 Polish: Refined dashboard staggered animations (60fps).",
                "Native Sync: Optimized Android splash screen weight and color matching."
            ],
            hi: [
                "अल्ट्रा-फास्ट रिवील: हाई-स्पीड, 400ms सिनेमैटिक एंट्री ट्रांजिशन।",
                "सीमलेस यूआई हैंडऑफ़: 'फॉलिंग एलीमेंट्स' और ग्रे फ्लैश को खत्म किया गया।",
                "मटेरियल 3 पॉलिश: रिफाइंड डैशबोर्ड स्टैचर्ड एनिमेशन (60fps)।",
                "नेटिव सिंक: ऑप्टिमाइज्ड एंड्रॉइड स्पैश स्क्रीन वेट और कलर मैचिंग।"
            ]
        }
    },
    {
        version: "2.17.14",
        date: "2026-03-17",
        title: {
            en: "Cinematic Entry (v2.17.14)",
            hi: "सिनेमैटिक एंट्री (v2.17.14)",
        },
        changes: {
            en: [
                "Implemented 'Radial Scale' reveal for a luxury app startup experience.",
                "Orchestrated staggered 'Glide-In' animations for the Bento dashboard.",
                "Achieved zero-gap theme transition by locking native splash hex codes.",
                "Fixed all perceived 'falling elements' via coordinate JS-Native handoff."
            ],
            hi: [
                "एक लक्ज़री ऐप स्टार्टअप अनुभव के लिए 'रेडियल स्केल' रिवील लागू किया गया।",
                "बेंटो डैशबोर्ड के लिए मंचित 'ग्लाइड-इन' एनिमेशन को व्यवस्थित किया गया।",
                "नेटिव स्प्लैश हेक्स कोड को लॉक करके जीरो-गैप थीम ट्रांजिशन हासिल किया गया।",
                "समन्वित JS-नेटिव हैंडऑफ के माध्यम से सभी बोधगम्य 'गिरने वाले तत्वों' को ठीक किया गया।"
            ]
        }
    },
    {
        version: "2.17.12",
        date: "2026-03-17",
        title: {
            en: "Premium Entry (v2.17.12)",
            hi: "प्रीमियम एंट्री (v2.17.12)",
        },
        changes: {
            en: [
                "Eliminated the grey startup flash by re-enabling native window preview with synchronized themes.",
                "Implemented hardware-accelerated 60fps fade-in to mask initial layout shifts.",
                "Enabled React Native New Architecture for direct native-to-JS performance.",
                "Restored the original adaptive icon identity with a clean white background."
            ],
            hi: [
                "सिंक्रोनाइज़्ड थीम के साथ नेटिव विंडो प्रीव्यू को फिर से सक्षम करके स्टार्टअप ग्रे फ्लैश को खत्म किया गया।",
                "प्रारंभिक लेआउट शिफ्ट को छिपाने के लिए हार्डवेयर-एक्सेलेरेटेड 60fps फेड-इन लागू किया गया।",
                "डायरेक्ट नेटिव-टू-जेएस प्रदर्शन के लिए रिएक्ट नेटिव न्यू आर्किटेक्चर को सक्षम किया गया।",
                "क्लीन व्हाइट बैकग्राउंड के साथ मूल एडेप्टिव आइकन पहचान को बहाल किया गया।"
            ]
        }
    },
    {
        version: "2.17.11",
        date: "2026-03-17",
        title: {
            en: "Hyper-Instant Launch (Hotfix v2)",
            hi: "हाइपर-इंस्टेंट लॉन्च (हॉटफिक्स v2)",
        },
        changes: {
            en: [
                "Resolved critical build failures caused by missing 'android.os.Build' and 'BuildConfig' imports.",
                "Stabilized 'Direct-to-Native' data pre-loading for production environments.",
                "Ensured seamless Frame-One content rendering from SQLite."
            ],
            hi: [
                "गायब 'android.os.Build' और 'BuildConfig' इंपोर्ट के कारण होने वाली महत्वपूर्ण बिल्ड विफलताओं को हल किया गया।",
                "प्रोडक्शन वातावरण के लिए 'डायरेक्ट-टू-नेटिव' डेटा प्री-लोडिंग को स्थिर किया गया।",
                "SQLite से निर्बाध फ्रेम-वन कंटेंट रेंडरिंग सुनिश्चित की गई।"
            ]
        }
    },
    {
        version: "2.17.8",
        date: "2026-03-17",
        title: {
            en: "Smooth Landing",
            hi: "स्मूद लैंडिंग",
        },
        changes: {
            en: [
                "Implemented 'Smooth Landing' skeleton to eliminate the 'elements falling' effect during startup.",
                "Decoupled font loading from the startup sequence for a truly 'Instant' visual pounce.",
                "Calibrated native background colors to perfectly match the app's 'Classic' theme tokens.",
                "Reduced frame-drop during initial render by staggering heavy component mounts."
            ],
            hi: [
                "स्टार्टअप के दौरान 'एलिमेंट्स गिरने' के प्रभाव को खत्म करने के लिए 'स्मूद लैंडिंग' स्केलेटन लागू किया गया।",
                "वास्तव में 'इंस्टेंट' विजुअल अनुभव के लिए स्टार्टअप अनुक्रम से फ़ॉन्ट लोडिंग को अलग किया गया।",
                "ऐप के 'क्लासिक' थीम टोकन से पूरी तरह मेल खाने के लिए नेटिव बैकग्राउंड कलर को कैलिब्रेट किया गया।",
                "भारी कंपोनेंट माउंट को रोककर प्रारंभिक रेंडर के दौरान फ्रेम-ड्रॉप को कम किया गया।"
            ]
        }
    },
    {
        version: "2.17.7",
        date: "2026-03-17",
        title: {
            en: "Deep Native Purge",
            hi: "डीप नेटिव पर्ज",
        },
        changes: {
            en: [
                "Achieved true 'Instant' launch by disabling native preview windows (windowDisablePreview).",
                "Synchronized native startup background colors with the app's light/dark themes.",
                "Patched native activity to eliminate the split-second white/black flash during JS initial load.",
                "Optimized native theme overhead to match high-performance native app behavior."
            ],
            hi: [
                "नेटिव प्रीव्यू विंडो (windowDisablePreview) को अक्षम करके वास्तविक 'इंस्टेंट' लॉन्च हासिल किया गया।",
                "ऐप के लाइट/डार्क थीम के साथ नेटिव स्टार्टअप बैकग्राउंड कलर को सिंक्रोनाइज़ किया गया।",
                "JS प्रारंभिक लोड के दौरान स्प्लिट-सेकंड सफेद/काले फ्लैश को खत्म करने के लिए नेटिव एक्टिविटी को पैच किया गया।",
                "उच्च-प्रदर्शन वाले नेटिव ऐप्स के व्यवहार से मेल खाने के लिए नेटिव थीम ओवरहेड को अनुकूलित किया गया।"
            ]
        }
    },
    {
        version: "2.17.6",
        date: "2026-03-15",
        title: {
            en: "Instant Polish",
            hi: "इंस्टेंट पॉलिश",
        },
        changes: {
            en: [
                "Fixed home title layout to prevent '..' truncation with three header icons.",
                "Implemented 'Pure Nothing' Startup using a transparent native window for instant reveal.",
                "Synchronized native themes to follow system behavior without flash color delay.",
                "Cleaned up repository tracking by ignoring sensitive and tool-generated folders."
            ],
            hi: [
                "तीन हेडर आइकन के साथ '..' ट्रंकेशन को रोकने के लिए होम टाइटल लेआउट को ठीक किया गया।",
                "तत्काल प्रकटीकरण के लिए पारदर्शी नेटिव विंडो का उपयोग करके 'प्योर नथिंग' स्टार्टअप लागू किया गया।",
                "फ्लैश कलर देरी के बिना सिस्टम व्यवहार का पालन करने के लिए नेटiv थीम को सिंक्रोनाइज़ किया गया।",
                "सेंसिटिव और टूल-जनरेटेड फोल्डर को अनदेखा करके रिपॉजिटरी ट्रैकिंग को क्लीन किया गया।"
            ]
        }
    },
    {
        version: "2.17.5",
        date: "2026-03-15",
        title: {
            en: "Maximum Direct Launch",
            hi: "अधिकतम डायरेक्ट लॉन्च",
        },
        changes: {
            en: [
                "Achieved 'Pure No-Splash' experience by purging all splash configs and dependencies.",
                "Removed legacy expo-splash-screen bridge to reduce startup latency.",
                "Optimized native theme to launch directly into the app background color.",
                "Verified repository hygiene and documentation privacy."
            ],
            hi: [
                "सभी स्पलैश कॉन्फ़िगरेशन और डिपेंडेंसी को हटाकर 'प्योर नो-स्पलैश' अनुभव प्राप्त किया गया।",
                "स्टार्टअप विलंबता को कम करने के लिए लीगेसी एक्सपो-स्पलैश-स्क्रीन ब्रिज को हटाया गया।",
                "सीधे ऐप बैकग्राउंड कलर में लॉन्च करने के लिए नेटिव थीम को अनुकूलित किया गया।",
                "रिपॉजिटरी हाइजीन और डॉक्यूमेंटेशन प्राइवेसी को सत्यापित किया गया।"
            ]
        }
    },
    {
        version: "2.17.4",
        date: "2026-03-15",
        title: {
            en: "Stability & Layout Hotfix",
            hi: "स्थिरता और लेआउट हॉटफिक्स",
        },
        changes: {
            en: [
                "Fixed the persistent update notification loop by syncing environment versions.",
                "Minimized the white startup flash by enforcing native background themes.",
                "Restored the home title wordmark to a single-line layout.",
                "Optimized app initialization flow for faster production builds."
            ],
            hi: [
                "एनवायरनमेंट वर्शन्स को सिंक करके लगातार अपडेट अधिसूचना लूप को ठीक किया गया।",
                "नेटिव बैकग्राउंड थीम लागू करके सफेद स्टार्टअप फ्लैश को कम किया गया।",
                "होम टाइटल वर्डमार्क को सिंगल-लाइन लेआउट में वापस लाया गया।",
                "तेज उत्पादन बिल्ड के लिए ऐप इनिशियलाइजेशन फ्लो को अनुकूलित किया गया।"
            ]
        }
    },
    {
        version: "2.17.2",
        date: "2026-03-15",
        title: {
            en: "Extreme Splash Removal & Brand Revert",
            hi: "एक्सट्रीम स्प्लैश रिमूवल और ब्रांड रिवर्ट",
        },
        changes: {
            en: [
                "Implemented 'Invisible Splash' strategy to bypass mandatory Android 12 splash screen.",
                "Reverted Home branding back to 'Saral Lekhan' using Poppins typography for stability.",
                "Optimized startup sequence to hide native splash immediately on mount.",
                "Fixed CI/CD build warnings and upgraded GitHub Actions to v4."
            ],
            hi: [
                "अनिवार्य 'Android 12' स्प्लैश स्क्रीन को बायपास करने के लिए 'इनविजिबल स्प्लैश' रणनीति लागू की गई।",
                "स्थिरता के लिए पॉपिन्स टाइपोग्राफी का उपयोग करके होम ब्रांडिंग को वापस 'Saral Lekhan' में बदल दिया गया।",
                "माउंट होने पर नेटिव स्प्लैश को तुरंत छिपाने के लिए स्टार्टअप सीक्वेंस को अनुकूलित किया गया।",
                "CI/CD बिल्ड चेतावनियों को ठीक किया गया और GitHub Actions को v4 पर अपग्रेड किया गया।"
            ]
        }
    },
    {
        version: "2.17.1",
        date: "2026-03-15",
        title: {
            en: "Splash Screen Removal",
            hi: "स्प्लैश स्क्रीन को हटाना",
        },
        changes: {
            en: [
                "Completely removed both native and JS splash screens for direct app launch.",
                "Optimized startup sequence for immediate UI rendering.",
                "Removed expo-splash-screen dependency to reduce app size and complexity.",
                "Deleted all legacy splash assets (images and documentation) to keep the project clean."
            ],
            hi: [
                "सीधे ऐप लॉन्च के लिए नेटिव और JS दोनों स्प्लैश स्क्रीन को पूरी तरह से हटा दिया गया है।",
                "तत्काल UI रेंडरिंग के लिए स्टार्टअप सीक्वेंस अनुकूलित किया गया।",
                "ऐप के आकार और जटिलता को कम करने के लिए expo-splash-screen डिपेंडेंसी हटा दी गई।",
                "प्रोजेक्ट को साफ रखने के लिए सभी पुराने स्प्लैश एसेट्स (इमेज और डॉक्यूमेंटेशन) को हटा दिया गया।"
            ]
        }
    },
    {
        version: "2.17.0",
        date: "2026-03-15",
        title: {
            en: "Brand & Startup Logic Rewrite",
            hi: "ब्रांड और स्टार्टअप लॉजिक का पुनर्लेखन",
        },
        changes: {
            en: [
                "Full rewrite of splash screen transition logic using state-driven coordination.",
                "Redesigned Home branding ('Saral लेखन') using Nested Text strategy for pixel-perfect baseline alignment.",
                "Optimized app initialization to eliminate startup blinks and UI jumps.",
                "Enhanced theme synchronization for seamless transition from native to JS layer."
            ],
            hi: [
                "स्टेट-ड्रिवन और समन्वित स्प्लैश स्क्रीन ट्रांजिशन का पुनर्लेखन।",
                "पिक्सेल-परफेक्ट अलाइनमेंट के लिए नेस्टेड टेक्स्ट रणनीति का उपयोग करके 'सरल लेखन' की री-डिजाइनिंग।",
                "स्टार्टअप ब्लिंक्स और UI जंप्स को खत्म करने के लिए ऐप इनिशियलाइजेशन का अनुकूलन।",
                "नेटिव से JS लेयर तक निर्बाध संक्रमण के लिए थीम सिंक्रोनाइज़ेशन में सुधार।"
            ]
        }
    },
    {
        version: '2.16.12',
        date: '2026-03-15',
        title: { en: 'Splash & Typography Fixes', hi: 'स्प्लैश और टाइपोग्राफी फिक्स' },
        changes: {
            en: [
                'Fixed "dual splash" perception with seamless JS-layer logo alignment.',
                'Added soft fade-out transition for app startup.',
                'Refined "Saral लेखन" typography and baseline alignment in Home header.',
                'Optimized font weights for Devanagari script consistency.'
            ],
            hi: [
                'निर्बाध JS-लेयर लोगो संरेखण के साथ "डुअल स्प्लैश" समस्या को ठीक किया गया।',
                'ऐप स्टार्टअप के लिए सॉफ्ट फेड-आउट ट्रांजिशन जोड़ा गया।',
                'होम हेडर में "सरल लेखन" टाइपोग्राफी और बेसलाइन संरेखण को परिष्कृत किया गया।',
                'देवनागरी लिपि की स्थिरता के लिए फ़ॉन्ट वेट को अनुकूलित किया गया।'
            ]
        }
    },
    {
        version: "2.16.11",
        date: "2026-03-15",
        changes: {
            en: [
                "Aligned Android splash handling with Expo's generated SDK 49 pattern so the splash theme inherits AppTheme instead of carrying a second handoff background.",
                "Delayed splash hide until the root navigation state is ready to reduce the extra blank frame after launch.",
                "Refined the Saral लेखन home wordmark so the Hindi half keeps its proper glyph shape without disturbing the Latin title styling.",
                "Restored a slimmer editor toolbar highlight so active formatting no longer gets cropped while keeping the bar compact.",
                "Upgraded code block styling with a clearer CODE label, accent rail, and stronger monospace surface so it reads like an intentional block."
            ],
            hi: [
                "Aligned Android splash handling with Expo's generated SDK 49 pattern so the splash theme inherits AppTheme instead of carrying a second handoff background.",
                "Delayed splash hide until the root navigation state is ready to reduce the extra blank frame after launch.",
                "Refined the Saral लेखन home wordmark so the Hindi half keeps its proper glyph shape without disturbing the Latin title styling.",
                "Restored a slimmer editor toolbar highlight so active formatting no longer gets cropped while keeping the bar compact.",
                "Upgraded code block styling with a clearer CODE label, accent rail, and stronger monospace surface so it reads like an intentional block."
            ],
            mr: [
                "Aligned Android splash handling with Expo's generated SDK 49 pattern so the splash theme inherits AppTheme instead of carrying a second handoff background.",
                "Delayed splash hide until the root navigation state is ready to reduce the extra blank frame after launch.",
                "Refined the Saral लेखन home wordmark so the Hindi half keeps its proper glyph shape without disturbing the Latin title styling.",
                "Restored a slimmer editor toolbar highlight so active formatting no longer gets cropped while keeping the bar compact.",
                "Upgraded code block styling with a clearer CODE label, accent rail, and stronger monospace surface so it reads like an intentional block."
            ]
        }
    },
    {
        version: "2.16.10",
        date: "2026-03-14",
        changes: {
            en: [
                "Collapsed the Android launch path back to a single Expo-controlled splash surface to address the remaining double-splash stack.",
                "Refined the fixed Saral लेखन home title lockup so the Latin and Hindi wordmark sit together more cleanly.",
                "Raised the editor toolbar height and button padding so selected formatting chips no longer clip at the bottom.",
                "Added divider and code block tools to the editor as the next low-risk writing feature tranche.",
                "Kept the image and Biometric Vault fixes from 2.16.9 intact and shipped this as a tagged updater release."
            ],
            hi: [
                "Collapsed the Android launch path back to a single Expo-controlled splash surface to address the remaining double-splash stack.",
                "Refined the fixed Saral लेखन home title lockup so the Latin and Hindi wordmark sit together more cleanly.",
                "Raised the editor toolbar height and button padding so selected formatting chips no longer clip at the bottom.",
                "Added divider and code block tools to the editor as the next low-risk writing feature tranche.",
                "Kept the image and Biometric Vault fixes from 2.16.9 intact and shipped this as a tagged updater release."
            ],
            mr: [
                "Collapsed the Android launch path back to a single Expo-controlled splash surface to address the remaining double-splash stack.",
                "Refined the fixed Saral लेखन home title lockup so the Latin and Hindi wordmark sit together more cleanly.",
                "Raised the editor toolbar height and button padding so selected formatting chips no longer clip at the bottom.",
                "Added divider and code block tools to the editor as the next low-risk writing feature tranche.",
                "Kept the image and Biometric Vault fixes from 2.16.9 intact and shipped this as a tagged updater release."
            ]
        }
    },
    {
        version: "2.16.9",
        date: "2026-03-14",
        changes: {
            en: [
                "Kept the native splash on screen until the first real app layout to reduce the second splash and blank launch gap.",
                "Fixed editor gallery images by embedding picker-provided Base64 as JPEG data before inserting into the editor.",
                "Routed editor text sizing through the effective font scale so font switching feels more uniform.",
                "Scaled settings pills and labels more consistently across the supported fonts.",
                "Flattened the Biometric Vault card border treatment and prepared this build as a tagged updater release."
            ],
            hi: [
                "पहले वास्तविक app layout तक native splash को रोके रखा गया, ताकि दूसरा splash और blank launch gap कम हो।",
                "Editor gallery images को insert करने से पहले picker Base64 को JPEG data के रूप में embed करके image loading ठीक किया गया।",
                "Editor text sizing को effective font scale से जोड़ा गया, ताकि font switching अधिक uniform लगे।",
                "Settings pills और labels को supported fonts में अधिक consistent scale दिया गया।",
                "Biometric Vault card की border treatment को flatten किया गया और इस build को tagged updater release के रूप में तैयार किया गया।"
            ],
            mr: [
                "पहिल्या खऱ्या app layout पर्यंत native splash दिसत ठेवला, त्यामुळे दुसरा splash आणि blank launch gap कमी झाला.",
                "Editor gallery images insert करण्यापूर्वी picker Base64 ला JPEG data म्हणून embed करून image loading दुरुस्त केले.",
                "Editor text sizing effective font scale शी जोडले, त्यामुळे font switching अधिक uniform वाटते.",
                "Settings pills आणि labels ला supported fonts मध्ये अधिक consistent scale दिला.",
                "Biometric Vault card ची border treatment flatten केली आणि हा build tagged updater release म्हणून तयार केला."
            ]
        }
    },
    {
        version: "2.16.8",
        date: "2026-03-14",
        changes: {
            en: [
                "Refined the fixed home title lockup for Saral लेखन.",
                "Stabilized editor image loading by embedding picked images for reliable reloads.",
                "Improved editor toolbar spacing and checklist styling for smoother writing.",
                "Adjusted Android splash handoff to remove the duplicated branded splash and blank gap.",
                "Retuned font normalization and cleaned the Biometric Vault card styling in Settings."],
            hi: [
                "Saral लेखन होम टाइटल लॉकअप को और बेहतर किया गया।",
                "एडिटर में चुनी गई इमेज को एम्बेड करके लोडिंग को अधिक भरोसेमंद बनाया गया।",
                "एडिटर टूलबार स्पेसिंग और चेकलिस्ट स्टाइलिंग को स्मूद लेखन के लिए सुधारा गया।",
                "Android splash handoff को समायोजित करके डुप्लीकेट branded splash और blank gap हटाया गया।",
                "फ़ॉन्ट normalization को बेहतर किया गया और Settings में Biometric Vault कार्ड को साफ़ किया गया।"],
            mr: [
                "Saral लेखन होम टायटल लॉकअप अधिक नीट केला.",
                "एडिटरमध्ये निवडलेल्या प्रतिमा एम्बेड करून इमेज लोडिंग अधिक विश्वासार्ह केले.",
                "स्मूथ लेखनासाठी एडिटर टूलबार स्पेसिंग आणि चेकलिस्ट स्टायलिंग सुधारले.",
                "Android splash handoff समायोजित करून डुप्लिकेट branded splash आणि blank gap काढला.",
                "फॉन्ट normalization सुधारले आणि Settings मधील Biometric Vault कार्ड अधिक स्वच्छ केले."]
        }
    },
    {
        version: "2.16.7",
        date: "2026-03-13",
        changes: {
            en: [
                "Attempted Android splash continuity refinement before the final correction in 2.16.8.",
                "Kept the crash-safe AppTheme handoff required for this Expo 49 Android startup path.",
                "Intermediate launch UX refinement release."],
            hi: [
                "2.16.8 की अंतिम correction से पहले Android splash continuity को refine करने का प्रयास किया गया।",
                "Expo 49 Android startup path के लिए आवश्यक crash-safe AppTheme handoff को बनाए रखा गया।",
                "मध्यवर्ती launch UX refinement release।"],
            mr: [
                "2.16.8 मधील अंतिम correctionपूर्वी Android splash continuity refine करण्याचा प्रयत्न केला.",
                "या Expo 49 Android startup path साठी आवश्यक crash-safe AppTheme handoff कायम ठेवला.",
                "मधला launch UX refinement release."]
        }
    },
    {
        version: "2.16.6",
        date: "2026-03-13",
        changes: {
            en: [
                "Hotfix: fixed startup crash happening right after splash on some devices.",
                "Android launch safety: restored AppTheme handoff before ReactActivity startup.",
                "Stability release for 2.16.5 splash transition changes."],
            hi: [
                "Hotfix: fixed startup crash happening right after splash on some devices.",
                "Android launch safety: restored AppTheme handoff before ReactActivity startup.",
                "Stability release for 2.16.5 splash transition changes."],
            mr: [
                "Hotfix: fixed startup crash happening right after splash on some devices.",
                "Android launch safety: restored AppTheme handoff before ReactActivity startup.",
                "Stability release for 2.16.5 splash transition changes."]
        }
    },
    {
        version: "2.16.5",
        date: "2026-03-13",
        changes: {
            en: [
                "Startup UX: reduced dual-splash perception by simplifying Android splash transition flow.",
                "CI Reliability: upgraded GitHub Actions to Node 24-ready action versions.",
                "Build Pipeline: enabled Node 24 runtime for JS-based GitHub Actions."],
            hi: [
                "Startup UX: reduced dual-splash perception by simplifying Android splash transition flow.",
                "CI Reliability: upgraded GitHub Actions to Node 24-ready action versions.",
                "Build Pipeline: enabled Node 24 runtime for JS-based GitHub Actions."],
            mr: [
                "Startup UX: reduced dual-splash perception by simplifying Android splash transition flow.",
                "CI Reliability: upgraded GitHub Actions to Node 24-ready action versions.",
                "Build Pipeline: enabled Node 24 runtime for JS-based GitHub Actions."]
        }
    },
    {
        version: "2.16.4",
        date: "2026-03-08",
        changes: {
            en: [
                "Native Splash & Icon background color synchronized across all Android versions (#d9d7d2).",
                "Fixed legacy dark splash appearing on Android 12+ devices in Dark Mode.",
                "Added Technical Environment & Build Guide for developer onboarding."
            ],
            hi: [
                "सभी Android वर्शन पर नेटिव स्प्लैश और आइकन बैकग्राउंड रंग सिंक किया गया (#d9d7d2)।",
                "डार्क मोड में Android 12+ डिवाइस पर दिखने वाले पुराने डार्क स्प्लैश को ठीक किया गया।",
                "डेवलपर ऑनबोर्डिंग के लिए तकनीकी परिवेश और बिल्ड गाइड जोड़ा गया।"
            ]
        }
    },
    {
        version: "2.16.3",
        date: "2026-03-08",
        changes: {
            en: [
                "Launch Consistency: Forced light-mode splash background even if the system is in dark mode.",
                "UI Stability: Eliminated the 'Dark Flash' by delaying theme-based background changes until ready.",
                "Asset Fix: Verified and enforced adaptive icon background colors."
            ],
            hi: [
                "लॉन्च स्थिरता: यदि सिस्टम डार्क मोड में है तो भी लाइट-मोड स्प्लैश बैकग्राउंड को लागू किया गया।",
                "UI स्थिरता: तैयार होने तक थीम-आधारित बैकग्राउंड परिवर्तनों में देरी करके 'डार्क फ्लैश' को समाप्त किया गया।",
                "एसेट फिक्स: एडेप्टिव आइकन बैकग्राउंड रंगों को सत्यापित और लागू किया गया।"
            ],
            mr: [
                "लॉन्च सातत्य: सिस्टीम डार्क मोडमध्ये असली तरीही लाइट-मोड स्प्लॅश बॅकग्राउंड सक्तीने लागू केले.",
                "UI स्थिरता: अ‍ॅप तयार होईपर्यंत थीम-आधारित बॅकग्राउंड बदल लांबणीवर टाकून 'डार्क फ्लॅश'ची समस्या दूर केली.",
                "एसेट फिक्स: अ‍ॅडॉप्टिव्ह आयकॉनचे बॅकग्राउंड रंग तपासून लागू केले."
            ]
        }
    },
    {
        version: "2.16.2",
        date: "2026-03-08",
        changes: {
            en: [
                "Startup Polish: Added logo to the intermediate loading screen for a 100% seamless transition.",
                "Sync: Perfect alignment of splash background colors across all app states.",
                "Versioning: Fixed the persistent update notification loop."
            ],
            hi: [
                "स्टार्टअप पॉलिश: 100% निर्बाध संक्रमण के लिए इंटरमीडिएट लोडिंग स्क्रीन में लोगो जोड़ा गया।",
                "सिंक: सभी ऐप राज्यों में स्प्लैश बैकग्राउंड रंगों का सही तालमेल।",
                "वर्जनिंग: लगातार अपडेट अधिसूचना लूप को ठीक किया गया।"
            ],
            mr: [
                "स्टार्टअप पॉलिश: १००% अखंड संक्रमणासाठी इंटरमीडिएट लोडिंग स्क्रीनमध्ये लोगो जोडला.",
                "सिंक: सर्व अ‍ॅप स्थितींमध्ये स्प्लॅश बॅकग्राउंड रंगांचे अचूक संरेखन.",
                "व्हर्जनिंग: सतत येणाऱ्या अपडेट नोटिफिकेशनची समस्या दूर केली."
            ]
        }
    },
    {
        version: "2.16.1",
        date: "2026-03-08",
        changes: {
            en: [
                "Performance: Intelligent splash dismissal logic that waits for the Home Screen to be ready.",
                "Branding: Updated official background color to #d9d7d2 for a softer, premium look."
            ],
            hi: [
                "प्रदर्शन: इंटेलिजेंट स्प्लैश डिसमिसल लॉजिक जो होम स्क्रीन के तैयार होने तक प्रतीक्षा करता है।",
                "ब्रांडिंग: सॉफ़्ट, प्रीमियम लुक के लिए आधिकारिक बैकग्राउंड रंग को #d9d7d2 पर अपडेट किया गया।"
            ],
            mr: [
                "परफॉर्मन्स: इंटेलिजेंट स्प्लॅश डिसमिसल लॉजिक जे होम स्क्रीन तयार होईपर्यंत प्रतीक्षा करते.",
                "ब्रँडिंग: सॉफ्ट, प्रीमियम लूकसाठी अधिकृत बॅकग्राउंड रंग #d9d7d2 वर अपडेट केला."
            ]
        }
    },
    {
        version: "2.16.0",
        date: "2026-03-08",
        changes: {
            en: [
                "Visual Identity: Launched new high-quality adaptive icons and splash screens.",
                "Performance: Optimized native resource handling for smoother app launch.",
                "Platform: Full support for Android 13+ adaptive icon themes."
            ],
            hi: [
                "विज़ुअल आइडेंटिटी: नए उच्च गुणवत्ता वाले एडेप्टिव आइकन और स्प्लैश स्क्रीन लॉन्च किए गए।",
                "प्रदर्शन: सुचारू ऐप लॉन्च के लिए नेटिव रिसोर्स हैंडलिंग को अनुकूलित किया गया।",
                "प्लेटफॉर्म: एंड्रॉइड 13+ एडेप्टिव आइकन थीम के लिए पूर्ण समर्थन।"
            ],
            mr: [
                "व्हिज्युअल आयडेंटिटी: नवीन उच्च-गुणवत्तेचे अ‍ॅडॉप्टिव्ह आयकॉन आणि स्प्लॅश स्क्रीन लॉन्च केले.",
                "परफॉर्मन्स: सुलभ अ‍ॅप लॉन्चसाठी नेटिव्ह रिसोर्स हँडलिंग ऑप्टिमाइझ केले.",
                "प्लॅटफॉर्म: अँड्रॉइड 13+ अ‍ॅडॉप्टिव्ह आयकॉन थीमसाठी पूर्ण समर्थन."
            ]
        }
    },
    {
        version: "2.15.5",
        date: "2026-03-08",
        changes: {
            en: [
                "Build System: Resolved 'Resource Not Found' error by fixing Git asset visibility.",
                "Assets: Successfully pushed adaptive icon foreground layers for all densities.",
            ],
            hi: [
                "बिल्ड सिस्टम: गिट एसेट विजिबिलिटी को ठीक करके 'रिसोर्स नॉट फाउंड' त्रुटि को हल किया गया।",
                "एसेट्स: सभी डेंसिटी के लिए एडेप्टिव आइकन फोरग्राउंड लेयर्स को सफलतापूर्वक पुश किया गया।"
            ],
            mr: [
                "बिल्ड सिस्टम: गिट एसेट व्हिजिबिलिटी फिक्स करून 'रिसोर्स नॉट फाउंड' त्रुटी सोडवली.",
                "एसेट्स: सर्व डेन्सिटीसाठी अ‍ॅडॉप्टिव्ह आयकॉन फोरग्राउंड लेयर्स यशस्वीरित्या पुश केले."
            ]
        }
    },
    {
        version: "2.15.4",
        date: "2026-03-08",
        changes: {
            en: [
                "Native Assets: Fixed missing app icon and splash screen branding.",
                "Sync: Forcibly synchronized native Android resources with the new logo.",
            ],
            hi: [
                "नेटिव एसेट्स: गायब ऐप आइकन और स्प्लैश स्क्रीन ब्रांडिंग को ठीक किया गया।",
                "सिंक: नए लोगो के साथ नेटिव एंड्रॉइड संसाधनों को सफलतापूर्वक सिंक्रनाइज़ किया गया।"
            ],
            mr: [
                "नेटिव एसेट्स: गायब अ‍ॅप आयकॉन आणि स्प्लॅश स्क्रीन ब्रँडिंग फिक्स केले.",
                "सिंक: नवीन लोगोसह नेटिव्ह अँड्रॉइड रिसोर्सेस यशस्वीरित्या सिंक्रोनाइझ केले."
            ]
        }
    },
    {
        version: "2.15.3",
        date: "2026-03-08",
        changes: {
            en: [
                "Brand Identity: Introducing our new official logo across the app icon and adaptive icons.",
                "Updater Verification: Version bump to v2.15.3 to verify the advanced PackageInstaller logic.",
            ],
            hi: [
                "ब्रांड पहचान: ऐप आइकन और एडेप्टिव आइकन पर अपना नया आधिकारिक लोगो पेश कर रहे हैं।",
                "अपडेटर सत्यापन: उन्नत PackageInstaller लॉजिक को सत्यापित करने के लिए v2.15.3 पर स्विच किया गया।"
            ],
            mr: [
                "ब्रँड ओळख: अ‍ॅप आयकॉन आणि अ‍ॅडॉप्टिव्ह आयकॉनवर आमचा नवीन अधिकृत लोगो सादर करत आहोत.",
                "अपडेटर पडताळणी: प्रगत PackageInstaller लॉजिक तपासण्यासाठी v2.15.3 व्हर्जन रिलीज."
            ]
        }
    },
    {
        version: "2.15.2",
        date: "2026-03-07",
        changes: {
            en: [
                "Installer Fix: Implemented native status tracking to ensure the 'Update?' dialog appears reliably.",
                "Permissions: Added explicit 'Install Unknown Apps' checks and guidance to Settings.",
                "Stability: Refactored the PackageInstaller session flow for better OEM compatibility (Xiaomi/MIUI).",
            ],
            hi: [
                "इंस्टॉलर फिक्स: 'अपडेट?' संवाद विश्वसनीय रूप से दिखाई देने के लिए नेटिव स्टेटस ट्रैकिंग लागू की गई।",
                "अनुमतियाँ: स्पष्ट 'अज्ञात ऐप्स इंस्टॉल करें' जांच और सेटिंग्स में मार्गदर्शन जोड़ा गया।",
                "स्थिरता: बेहतर OEM संगतता (Xiaomi/MIUI) के लिए PackageInstaller सेशन फ्लो को रिफैक्टर किया गया।"
            ],
            mr: [
                "इन्स्टॉलर फिक्स: 'अपडेट?' डायलॉग खात्रीशीरपणे दिसण्यासाठी नेटिव्ह स्टेटस ट्रॅकिंग लागू केले.",
                "परवानग्या: 'अनोळखी अ‍ॅप्स इन्स्टॉल करा' परवानग्यांची तपासणी आणि सेटिंग्जमध्ये मार्गदर्शन जोडले.",
                "स्थिरता: OEM सुसंगततेसाठी (Xiaomi/MIUI) PackageInstaller सेशन फ्लोमध्ये सुधारणा केली."
            ]
        }
    },
    {
        version: "2.15.1",
        date: "2026-03-07",
        changes: {
            en: [
                "Advanced Updater: Implemented native 'Direct Install' using Android PackageInstaller API.",
                "Numeric Versioning: Switched to expert numeric comparison for robust update detection.",
                "Crash Fix: Resolved app crashes when switching to Bengali, Tamil, and Telugu locales.",
                "Locale Sync: Fully synchronized all 6 supported languages (EN, HI, MR, BN, TA, TE).",
            ],
            hi: [
                "एडवांस अपडेटर: एंड्रॉइड PackageInstaller API का उपयोग करके नेटिव 'डायरेक्ट इंस्टॉल' लागू किया गया।",
                "न्यूमेरिक वर्जनिंग: मजबूत अपडेट डिटेक्शन के लिए एक्सपर्ट न्यूमेरिक तुलना पर स्विच किया गया।",
                "क्रैश फिक्स: बंगाली, तमिल और तेलुगु भाषाओं में स्विच करने पर ऐप क्रैश होने की समस्या को हल किया गया।",
                "लोकेल सिंक: सभी 6 समर्थित भाषाओं को पूरी तरह से सिंक्रनाइज़ किया गया।"
            ],
            mr: [
                "प्रगत अपडेटर: अँड्रॉइड PackageInstaller API वापरून नेटिव्ह 'डायरेक्ट इन्स्टॉल' लागू केले।",
                "न्यूमेरिक व्हर्जनिंग: अचूक अपडेट तपासणीसाठी एक्सपर्ट न्यूमेरिक तुलना पद्धत वापरली।",
                "क्रॅश फिक्स: बंगाली, तमिळ आणि तेलगू भाषा बदलताना येणारी अ‍ॅप क्रॅशची समस्या सोडवली।",
                "लोकेल सिंक: सर्व 6 समर्थित भाषा पूर्णपणे सिंक्रोनाइझ केल्या।"
            ]
        }
    },
    {
        version: "2.15.0",
        date: "2026-03-07",
        changes: {
            en: [
                "Feature Discovery: Replaced the old changelog icon with a new interactive Highlights modal.",
                "Settings Redesign: Logical grouping into Aesthetics, Security, Cloud, and Maintenance.",
                "Font Fix: Applied global `includeFontPadding: false` to solve Devanagari (Marathi/Hindi) clipping.",
                "Localization: Synchronized and optimized strings across English, Marathi, and Hindi.",
            ],
            hi: [
                "सुविधाओं की खोज: पुराने चेंजलॉग आइकन को नए इंटरेक्टिव हाइलाइट्स मोडल से बदला गया।",
                "सेटिंग्स रिडिज़ाइन: सौंदर्यशास्त्र, सुरक्षा, क्लाउड और रखरखाव में तार्किक समूहन।",
                "फ़ॉन्ट फिक्स: देवनागरी (मराठी/हिंदी) क्लिपिंग को हल करने के लिए `includeFontPadding: false` लागू किया गया।",
                "स्थानीयकरण: अंग्रेजी, मराठी और हिंदी में अनुकूलित अनुवाद।"
            ],
            mr: [
                "नवीन वैशिष्ट्ये: जुन्या चेंजलॉग आयकॉनच्या जागी नवीन इंटरअॅक्टिव्ह हायलाइट्स मोडल.",
                "सेटिंग्ज पुनर्रचना: सौंदर्यशास्त्र, सुरक्षा, क्लाउड आणि देखभाल विभागांमध्ये विभागणी.",
                "फॉन्ट फिक्स: देवनागरी (मराठी/हिंदी) मजकूर कापला जाण्याची समस्या सोडवण्यासाठी `includeFontPadding: false` लागू केले.",
                "लोकेलायझेशन: इंग्रजी, मराठी आणि हिंदी भाषांमधील मजकूर सुधारला आणि अपडेट केला."
            ]
        }
    },
    {
        version: "2.14.0",
        date: "2026-03-06",
        changes: {
            en: [
                "Recovery UI: Added a manual bypass button if the app hangs for more than 10 seconds.",
                "Biometric Fail-Safe: Implemented a timeout for the lock screen to prevent it from blocking the app.",
                "Optimization: Consolidated initialization logic and removed redundant database calls.",
            ],
            hi: [
                "रिकवरी UI: यदि ऐप 10 सेकंड से अधिक समय तक हैंग रहता है तो एक मैनुअल बायपास बटन जोड़ा गया।",
                "बायोमेट्रिक फेल-सेफ: लॉक स्क्रीन को ऐप को ब्लॉक करने से रोकने के लिए टाइमआउट लागू किया गया।",
                "ऑप्टिमाइज़ेशन: इनिशियलाइज़ेशन लॉजिक को समेकित किया गया और अनावश्यक डेटाबेस कॉल को हटाया गया।",
            ],
            ta: [
                "மீட்டெடுப்பு UI: ஆப் 10 வினாடிகளுக்கு மேல் முடங்கினால் மேனுவல் பைபாஸ் பட்டன் சேர்க்கப்பட்டது.",
                "பயோமெட்ரிக் ஃபெயில்-சேஃப்: லாக் ஸ்கிரீன் ஆப்பைத் தடுப்பதைத் தவிர்க்க காலாவதி நேரம் செயல்படுத்தப்பட்டது.",
                "மேம்படுத்தல்: துவக்க லாஜிக் ஒருங்கிணைக்கப்பட்டது மற்றும் தேவையற்ற தரவுத்தள அழைப்புகள் நீக்கப்பட்டன.",
            ]
        }
    },
    {
        version: "2.13.2",
        date: "2026-03-06",
        changes: {
            en: [
                "Fail-Safe UI: Implemented guaranteed rendering after 5s regardless of asset loading status.",
                "Deadlock Prevention: Refactored background initialization to prevent race conditions during boot.",
                "Improved Diagnostics: Added surgical logging to identify device-specific startup hangs.",
            ],
            hi: [
                "फेल-सेफ UI: संपत्ति लोडिंग स्थिति की परवाह किए बिना 5 सेकंड के बाद गारंटीकृत प्रतिपादन लागू किया गया।",
                "डेडलॉक रोकथाम: बूट के दौरान रेस स्थितियों को रोकने के लिए पृष्ठभूमि इनिशियलाइज़ेशन को रिफैक्टर किया गया।",
                "बेहतर डायग्नोस्टिक्स: डिवाइस-विशिष्ट स्टार्टअप हैंग की पहचान करने के लिए सर्जिकल लॉगिंग जोड़ी गई।",
            ],
            ta: [
                "ஃபெயில்-சேஃப் UI: சொத்து ஏற்றுதல் நிலையைக் பொருட்படுத்தாமல் 5 வினாடிகளுக்குப் பிறகு உத்தரவாதம் அளிக்கப்பட்ட ரெண்டரிங் செயல்படுத்தப்பட்டது.",
                "டெட்லாக் தடுப்பு: துவக்கத்தின் போது ரேஸ் நிலைமைகளைத் தடுக்க பின்னணி துவக்கம் மீண்டும் உருவாக்கப்பட்டது.",
                "மேம்படுத்தப்பட்ட கண்டறிதல்: சாதன-குறிப்பிட்ட தொடக்க சிக்கல்களைக் கண்டறிய அறுவை சிகிச்சை பதிவு சேர்க்கப்பட்டது.",
            ]
        }
    },
    {
        version: "2.13.1",
        date: "2026-03-06",
        changes: {
            hi: [
                "स्टार्टअप स्थिरता में सुधार किया गया (Grey Screen fix)",
                "ऑफ़लाइन फोंट को एप में शामिल किया गया"],
            en: [
                "Deep Startup stability fixes (Resolves Grey Screen hang)",
                "Bundled core fonts directly into the APK for 100% offline reliability"],
            mr: [
                "स्टार्टअप स्थिरता सुधार (Grey Screen fix)",
                "ऑफलाइन फोंट समाविष्ट केले"]
        }
    },
    {
        version: "2.13.0",
        date: "2026-03-06",
        changes: {
            en: [
                "Performance Boost: Switched to FlashList for ultra-smooth scrolling through large note collections.",
                "Efficient Rendering: Implemented component memoization to eliminate unnecessary screen updates.",
                "Agent skills: Applied production-grade optimization rules from vercel-react-native-skills.",
                "Memory Guard: Optimized item recycling to keep the app snappy during long sessions."
            ],
            hi: [
                "परफॉरमेंस बूस्ट: बड़े नोट कलेक्शन में स्मूथ स्क्रॉलिंग के लिए FlashList का उपयोग।",
                "कुशल रेंडरिंग: अनावश्यक स्क्रीन अपडेट को रोकने के लिए कंपोनेंट मेमोइज़ेशन।",
                "एजेंट स्किल्स: बेहतर कोड के लिए vercel-react-native-skills के नियमों का पालन।",
                "मेमोरी गार्ड: लंबे सेशन के दौरान ऐप को तेज़ रखने के लिए ऑप्टिमाइज़ेशन।"
            ],
            mr: [
                "परफॉर्मन्स बूस्ट: मोठ्या नोट कलेक्शनमध्ये स्मूथ स्क्रोलिंगसाठी FlashList चा वापर।",
                "कार्यक्षम रेंडरिंग: अनावश्यक स्क्रीन अपडेट्स टाळण्यासाठी कंपोनेंट मेमोयझेशन।",
                "एजंट स्किल्स: उत्तम कोडसाठी vercel-react-native-skills नियमांचे एकत्रीकरण।",
                "मेमरी गार्ड: लांब सेशन्स दरम्यान अ‍ॅप वेगवान ठेवण्यासाठी ऑप्टिमायझेशन।"
            ]
        }
    },
    {
        version: "2.12.0",
        date: "2026-03-06",
        changes: {
            en: [
                "Premium Startup: Skeleton loader removed and white flash fixed — app stays themed during boot.",
                "Simplified Themes: Removed AMOLED mode and 'Light & Dark' palette for a cleaner experience.",
                "Smarter Updater: Strict version checking ensures you only get notified for NEW releases.",
                "Themed Modals: All update and system alerts now follow the beautiful themed UI.",
                "Clean House: Removed legacy components and unused code."
            ],
            hi: [
                "प्रीमियम स्टार्टअप: स्केलेटन लोडर हटाया गया और सफेद फ्लैश फिक्स — स्टार्टअप अब पूरी तरह थीम वाला है।",
                "सरलीकृत थीम: बेहतर अनुभव के लिए AMOLED मोड और 'Light & Dark' पैलेट को हटाया गया।",
                "स्मार्ट अपडेटर: सख्त वर्जन चेकिंग सुनिश्चित करती है कि आपको केवल नई रिलीज की सूचना मिले।",
                "थीम्ड मोडल्स: सभी अपडेट और सिस्टम अलर्ट अब सुंदर थीम्ड UI का पालन करते हैं।",
                "हाउस क्लीनिंग: पुराने घटकों और अप्रयुक्त कोड को हटाया गया।"
            ],
            mr: [
                "प्रीमियम स्टार्टअप: स्केलेटन लोडर काढला आणि पांढरा फ्लॅश फिक्स — स्टार्टअप आता पूर्णपणे थीम्ड आहे.",
                "सरलीकृत थीम्स: चांगल्या अनुभवासाठी AMOLED मोड आणि 'Light & Dark' पॅलेट काढून टाकले.",
                "स्मार्ट अपडेटर: कडक व्हर्जन चेकिंग सुनिश्चित करते की तुम्हाला फक्त नवीन रिलीजची सूचना मिळेल.",
                "थीम्ड मोडल्स: सर्व अपडेट आणि सिस्टम अलर्ट आता सुंदर थीम्ड UI चे पालन करतात.",
                "हाउस क्लीनिंग: जुने घटक आणि न वापरलेले कोड काढले."
            ]
        }
    },
    {
        version: "2.10.1",
        date: "2026-03-04",
        changes: {
            en: [
                "Updater fixed: Android installer now launches without hanging at 100%.",
                "Added install permission support for Android package installer flow.",
                "CI now prints SHA-1 and SHA-256 fingerprints for Firebase registration.",
                "Google Sign-In stability improved for production release builds.",
                "Added Google Sign-In fallback retry when strict client config fails on some devices."],
            hi: [
                "Updater fixed: Android installer now launches without hanging at 100%.",
                "Added install permission support for Android package installer flow.",
                "CI now prints SHA-1 and SHA-256 fingerprints for Firebase registration.",
                "Google Sign-In stability improved for production release builds.",
                "Added Google Sign-In fallback retry when strict client config fails on some devices."],
            mr: [
                "Updater fixed: Android installer now launches without hanging at 100%.",
                "Added install permission support for Android package installer flow.",
                "CI now prints SHA-1 and SHA-256 fingerprints for Firebase registration.",
                "Google Sign-In stability improved for production release builds.",
                "Added Google Sign-In fallback retry when strict client config fails on some devices."]
        }
    },
    {
        version: "2.10.0",
        date: "2026-03-04",
        changes: {
            en: [
                "Instant Launch: Database now pre-loads during splash — no more loading skeleton",
                "Login Fix: Improved Google Sign-In error handling and SHA fingerprint guidance",
                "Crash Guard: App never gets stuck on loading screen, even on DB errors",
                "Updated changelog and documentation for Play Store readiness"
            ],
            hi: [
                "तुरंत लॉन्च: डेटाबेस अब स्प्लैश के दौरान प्री-लोड होता है — कोई लोडिंग स्क्रीन नहीं",
                "लॉगिन फिक्स: Google साइन-इन त्रुटि हैंडलिंग और SHA फिंगरप्रिंट मार्गदर्शन में सुधार",
                "क्रैश गार्ड: ऐप कभी भी लोडिंग स्क्रीन पर अटकती नहीं है",
                "Play Store तैयारी के लिए अपडेटेड चेंजलॉग और दस्तावेज़"
            ],
            mr: [
                "त्वरित लॉन्च: डेटाबेस आता स्प्लॅश दरम्यान प्री-लोड होतो — लोडिंग स्क्रीन नाही",
                "लॉगिन फिक्स: Google साइन-इन त्रुटी हाताळणी आणि SHA फिंगरप्रिंट मार्गदर्शन सुधारले",
                "क्रॅश गार्ड: अ‍ॅप कधीही लोडिंग स्क्रीनवर अडकत नाही",
                "Play Store तयारीसाठी अपडेटेड चेंजलॉग आणि दस्तऐवज"
            ]
        }
    },
    {
        version: "2.9.9",
        date: "2026-03-04",
        changes: {
            en: [
                "Drive 403 errors now show clear action steps (including API-disabled guidance).",
                "Release pipeline and update packaging reliability improved.",
                "Stability fixes in startup/auth flow for production builds."],
            hi: [
                "Drive 403 errors now show clear action steps (including API-disabled guidance).",
                "Release pipeline and update packaging reliability improved.",
                "Stability fixes in startup/auth flow for production builds."],
            mr: [
                "Drive 403 errors now show clear action steps (including API-disabled guidance).",
                "Release pipeline and update packaging reliability improved.",
                "Stability fixes in startup/auth flow for production builds."]
        }
    },
    {
        version: "2.9.8",
        date: "2026-03-04",
        changes: {
            en: [
                "Drive re-auth fallback improved for expired sessions.",
                "Removed hardcoded updater UI color to follow active app theme.",
                "Sync and account reconnect messaging made clearer."],
            hi: [
                "Drive re-auth fallback improved for expired sessions.",
                "Removed hardcoded updater UI color to follow active app theme.",
                "Sync and account reconnect messaging made clearer."],
            mr: [
                "Drive re-auth fallback improved for expired sessions.",
                "Removed hardcoded updater UI color to follow active app theme.",
                "Sync and account reconnect messaging made clearer."]
        }
    },
    {
        version: "2.9.7",
        date: "2026-03-04",
        changes: {
            en: [
                "Fixed startup crash caused by undefined catch handling in early boot path.",
                "Improved startup guardrails for edge-case init failures."],
            hi: [
                "Fixed startup crash caused by undefined catch handling in early boot path.",
                "Improved startup guardrails for edge-case init failures."],
            mr: [
                "Fixed startup crash caused by undefined catch handling in early boot path.",
                "Improved startup guardrails for edge-case init failures."]
        }
    },
    {
        version: "2.9.6",
        date: "2026-03-04",
        changes: {
            en: [
                "Startup catch-path hardening to avoid app boot failures on some builds.",
                "Versioning and release metadata consistency updates."],
            hi: [
                "Startup catch-path hardening to avoid app boot failures on some builds.",
                "Versioning and release metadata consistency updates."],
            mr: [
                "Startup catch-path hardening to avoid app boot failures on some builds.",
                "Versioning and release metadata consistency updates."]
        }
    },
    {
        version: "2.9.5",
        date: "2026-03-03",
        changes: {
            en: [
                "Entrypoint and updater installer flow improvements.",
                "Build pipeline fix for Android Gradle wrapper execution in CI.",
                "General release hardening and packaging cleanup."],
            hi: [
                "Entrypoint and updater installer flow improvements.",
                "Build pipeline fix for Android Gradle wrapper execution in CI.",
                "General release hardening and packaging cleanup."],
            mr: [
                "Entrypoint and updater installer flow improvements.",
                "Build pipeline fix for Android Gradle wrapper execution in CI.",
                "General release hardening and packaging cleanup."]
        }
    },
    {
        version: "2.9.4",
        date: "2026-03-03",
        changes: {
            en: [
                "Startup and auth stability refinements.",
                "Updater integration and release notes flow improvements.",
                "Internal reliability fixes across settings and sync surfaces."],
            hi: [
                "Startup and auth stability refinements.",
                "Updater integration and release notes flow improvements.",
                "Internal reliability fixes across settings and sync surfaces."],
            mr: [
                "Startup and auth stability refinements.",
                "Updater integration and release notes flow improvements.",
                "Internal reliability fixes across settings and sync surfaces."]
        }
    },
    {
        version: "2.9.3",
        date: "2026-03-02",
        changes: {
            en: [
                "Security Engine: Hardened biometric vaults and offline keys",
                "Production Speed: Removed legacy components for faster loading",
                "Bug Fixes: Resolved Drive sync duplication and Sentry reporting",
                "Global Reach: Enhanced support for newer regional dialects",
                "UI Polish: Minor layout spacing and typography adjustments"
            ],
            hi: [
                "सुरक्षा इंजन: मजबूत बायोमेट्रिक वॉल्ट और ऑफ़लाइन कुंजियाँ",
                "उत्पादन गति: तेज़ लोडिंग के लिए पुराने घटकों को हटाया गया",
                "बग फिक्स: ड्राइव सिंक दोहराव और सेंट्री रिपोर्टिंग को हल किया",
                "वैश्विक पहुंच: नई क्षेत्रीय बोलियों के लिए बेहतर समर्थन",
                "UI सुधार: मामूली लेआउट रिक्ति और टाइपोग्राफी समायोजन"
            ],
            mr: [
                "सुरक्षा इंजिन: मजबूत बायोमेट्रिक वॉल्ट आणि ऑफलाइन की",
                "उत्पादन गती: वेगवान लोडिंगसाठी जुने घटक काढले",
                "बग फिक्स: ड्राइव्ह सिंक डुप्लिकेशन आणि सेंट्री रिपोर्टिंग सोडवले",
                "जागतिक पोहोच: नवीन प्रादेशिक बोलींसाठी वर्धित समर्थन",
                "UI सुधारणा: किरकोळ लेआउट अंतर आणि टायपोग्राफी समायोजन"
            ]
        }
    },
    {
        version: "2.6.0",
        date: "2026-03-01",
        changes: {
            en: [
                "Multi-Select: Bulk delete and export notes from Home screen",
                "Editor Polish: Improved scrolling and list formatting breakout",
                "Image Rendering: Premium UI for images in the editor",
                "Sync Reliability: Instant refresh after backup restoration",
                "UI Consistency: Aligned actions and improved button contrast"
            ],
            hi: [
                "मल्टी-सिलेक्ट: होम स्क्रीन से नोट्स को बल्क डिलीट और एक्सपोर्ट करें",
                "एडिटर सुधार: बेहतर स्क्रॉलिंग और लिस्ट फॉर्मेटिंग ब्रेकआउट",
                "इमेज रेंडरिंग: एडिटर में इमेज के लिए प्रीमियम UI",
                "सिंक विश्वसनीयता: बैकअप रिस्टोर के बाद तुरंत रिफ्रेश",
                "UI निरंतरता: बेहतर सुधार और बटन कंट्रास्ट"
            ],
            mr: [
                "मल्टी-सिलेक्ट: होम स्क्रीनवरून नोट्स बल्क डिलीट आणि एक्सपोर्ट करा",
                "एडिटर सुधारणा: सुधारित स्क्रोलिंग आणि लिस्ट फॉरमॅटिंग ब्रेकआउट",
                "इमेज रेंडरिंग: एडिटरमध्ये इमेजसाठी प्रीमियम UI",
                "सिंक विश्वासार्हता: बॅकअप रिस्टोरनंतर त्वरित रिफ्रेश",
                "UI सुसंगतता: सुधारित क्रिया आणि बटन कॉन्ट्रास्ट"
            ]
        }
    },
    {
        version: "2.5.0",
        date: "2026-03-01",
        changes: {
            en: [
                "UI Restoration: Restored the classic single-row Home layout",
                "Performance: Removed redundant features for a faster experience",
                "Pro Visuals: Refined Bento cards and typography depth",
                "Developer Credits: Updated About section in Settings"
            ],
            hi: [
                "UI बहाली: क्लासिक सिंगल-रो होम लेआउट को फिर से बहाल किया गया",
                "प्रदर्शन: तेज़ अनुभव के लिए अनावश्यक सुविधाओं को हटाया गया",
                "प्रो विजुअल्स: बेहतर बेंटो कार्ड और टाइपोग्राफी की गहराई",
                "डेवलपर क्रेडिट: सेटिंग्स में 'अबाउट' अनुभाग अपडेट किया गया"
            ],
            mr: [
                "UI पुनर्संचयन: क्लासिक सिंगल-रो होम लेआउट पुनर्संचयित केले",
                "कामगिरी: वेगवान अनुभवासाठी अनावश्यक वैशिष्ट्ये काढून टाकली",
                "प्रो व्हिज्युअल्स: अधिक स्पष्ट बेंटो कार्ड आणि टायपोग्राफी",
                "डेव्हलपर क्रेडिट: सेटिंग्जमध्ये 'अबाउट' विभाग अपडेट केला"
            ]
        }
    },
    {
        version: "2.1.0",
        date: "2026-03-01",
        changes: {
            en: [
                "Added Rich Markdown support (Links & Images)",
                "Support for picking images from Gallery",
                "New 'What's New' section in Settings",
                "UI refinements for Link and Image modals",
                "Fixed editor scrolling and list font-size issues"
            ],
            hi: [
                "रिच मार्कडाउन समर्थन (लिंक और चित्र) जोड़ा गया",
                "गैलरी से चित्र चुनने की सुविधा",
                "सेटिंग्स में नया 'नया क्या है' खंड",
                "लिंक और चित्र मोडल्स के लिए UI सुधार",
                "संपादक स्क्रॉलिंग और सूची के फोंट-साइज की समस्याओं को ठीक किया गया"
            ],
            mr: [
                "रिच मार्कडाउन समर्थन (लिंक आणि प्रतिमा) जोडले",
                "गॅलरीमधून प्रतिमा निवडण्यासाठी समर्थन",
                "सेटिंग्जमध्ये नवीन 'नवीन काय आहे' विभाग",
                "लिंक आणि इमेज मोडल्ससाठी UI सुधारणा",
                "एडिटर स्क्रोलिंग आणि लिस्ट फॉन्ट-साईज समस्यांचे निवारण"
            ]
        }
    },
    {
        version: "2.0.0",
        date: "2026-02-28",
        changes: {
            en: [
                "Saral Lekhan Plus Release",
                "Biometric Vault for note security",
                "Google Drive Sync (Backup & Restore)",
                "Spark AI integration (Smart Title, Summarize)",
                "All-new Bento-style Home Screen layout"
            ],
            hi: [
                "सरल लेखन प्लस रिलीज",
                "नोट सुरक्षा के लिए बायोमेट्रिक वॉल्ट",
                "गूगल ड्राइव सिंक (बैकअप और रिस्टोर)",
                "स्पार्क एआई एकीकरण (स्मार्ट शीर्षक, सारांश)",
                "बिल्कुल नया बेंटो-शैली होम स्क्रीन लेआउट"
            ],
            mr: [
                "सरल लेखन प्लस रिलीज",
                "नोट सुरक्षिततेसाठी बायोमेट्रिक वॉल्ट",
                "Google ड्राइव्ह सिंक (बॅकअप आणि रिस्टोअर)",
                "स्पार्क एआय एकत्रीकरण (स्मार्ट शीर्षक, सारांश)",
                "नवीन बेंटो-शैली होम स्क्रीन लेआउट"
            ]
        }
    }
];
