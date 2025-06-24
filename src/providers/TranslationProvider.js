'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslationProvider = TranslationProvider;
var react_1 = require("react");
var react_g_translator_1 = require("@miracleufo/react-g-translator");
// Import our global.d.ts typings for Window
require("../types/global");
function TranslationProvider(_a) {
    var children = _a.children;
    var _b = (0, react_1.useState)('en'), sourceLanguage = _b[0], setSourceLanguage = _b[1];
    var _c = (0, react_1.useState)('en'), targetLanguage = _c[0], setTargetLanguage = _c[1];
    var _d = (0, react_1.useState)(false), isClient = _d[0], setIsClient = _d[1];
    // Initialize states after mounting to avoid hydration mismatch
    (0, react_1.useEffect)(function () {
        setIsClient(true);
        var storedLanguage = localStorage.getItem('preferredLanguage') || 'en';
        setTargetLanguage(storedLanguage);
        // Set up event listener for language changes
        var handleLanguageChange = function () {
            var newLanguage = localStorage.getItem('preferredLanguage') || 'en';
            setTargetLanguage(newLanguage);
        };
        window.addEventListener('storage', handleLanguageChange);
        // For direct updates from our LanguageSelector component
        var intervalId = setInterval(function () {
            if (window.selectedLanguage && window.selectedLanguage !== targetLanguage) {
                setTargetLanguage(window.selectedLanguage);
            }
        }, 500);
        return function () {
            window.removeEventListener('storage', handleLanguageChange);
            clearInterval(intervalId);
        };
    }, [targetLanguage]);
    // If we're still on the server or during hydration, just render children
    if (!isClient) {
        return <>{children}</>;
    }
    // If source and target languages are the same, don't translate
    if (sourceLanguage === targetLanguage) {
        return <>{children}</>;
    }
    return (<react_g_translator_1.Translator from={sourceLanguage} to={targetLanguage}>
      {children}
    </react_g_translator_1.Translator>);
}
