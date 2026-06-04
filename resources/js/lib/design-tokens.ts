export const bcccMotion = {
    easeLuxury: [0.22, 1, 0.36, 1] as const,
    easeSoft: [0.16, 1, 0.3, 1] as const,
    easeStandard: [0.4, 0, 0.2, 1] as const,

    duration: {
      fast: 0.16,
      normal: 0.26,
      slow: 0.52,
      cinematic: 0.95,
      hero: 1.35,
    },

    viewport: {
      once: true,
      amount: 0.18,
      margin: '0px 0px -80px 0px',
    },
  } as const;

  export const bcccReveal = {
    fadeUp: {
      hidden: {
        opacity: 0,
        y: 22,
        scale: 0.985,
        filter: 'blur(8px)',
      },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        transition: {
          duration: bcccMotion.duration.slow,
          ease: bcccMotion.easeLuxury,
        },
      },
    },

    fadeDown: {
      hidden: {
        opacity: 0,
        y: -18,
        scale: 0.985,
        filter: 'blur(8px)',
      },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        transition: {
          duration: bcccMotion.duration.slow,
          ease: bcccMotion.easeLuxury,
        },
      },
    },

    scaleIn: {
      hidden: {
        opacity: 0,
        scale: 0.965,
        filter: 'blur(10px)',
      },
      visible: {
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        transition: {
          duration: bcccMotion.duration.slow,
          ease: bcccMotion.easeLuxury,
        },
      },
    },

    imageOpen: {
      hidden: {
        opacity: 0,
        y: 34,
        scale: 1.16,
        rotateX: 8,
        filter: 'blur(16px) saturate(0.9)',
      },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        rotateX: 0,
        filter: 'blur(0px) saturate(1)',
        transition: {
          duration: bcccMotion.duration.hero,
          ease: bcccMotion.easeLuxury,
        },
      },
    },
  } as const;

  export const bcccStagger = {
    parent: {
      hidden: {},
      visible: {
        transition: {
          staggerChildren: 0.075,
          delayChildren: 0.05,
        },
      },
    },

    slowParent: {
      hidden: {},
      visible: {
        transition: {
          staggerChildren: 0.12,
          delayChildren: 0.12,
        },
      },
    },
  } as const;

  export const bcccClassNames = {
    container: 'bccc-container',
    containerWide: 'bccc-container-wide',
    publicSection: 'public-section',
    publicSectionTight: 'public-section-tight',
    kicker: 'bccc-section-kicker',
    title: 'bccc-section-title',
    titleSmall: 'bccc-section-title-sm',
    copy: 'bccc-section-copy',
    panel: 'bccc-lux-panel',
    card: 'bccc-public-card',
    imageFrame: 'bccc-image-frame',
    primaryButton: 'bccc-button-primary',
    secondaryButton: 'bccc-button-secondary',
    hiddenScrollbar: 'bccc-hidden-scrollbar',
  } as const;
