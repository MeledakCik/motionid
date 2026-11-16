module.exports = {
  plugins: {
    tailwindcss: {},
    // Safari / iOS 14–17 masih butuh awalan -webkit- untuk backdrop-filter (kaca blur).
    // Tanpa ini autoprefixer membuang awalan itu dan iPhone versi lama kehilangan efek kaca.
    autoprefixer: { overrideBrowserslist: ['defaults', 'safari >= 14', 'ios_saf >= 14'] },
  },
};
